import { Redis } from '@upstash/redis'

/**
 * Upstash Redis クライアント。
 *
 * 本番（Vercel）では Upstash インテグレーションが設定した
 * KV_REST_API_URL / KV_REST_API_TOKEN を自動で使う。
 * （`@upstash/redis` の `Redis.fromEnv()` は UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN も見る）
 *
 * 環境変数が無い場合（ローカル開発で vercel env pull していない時）は、
 * メモリ上のフェイク Redis にフォールバックする。
 * これにより「env が未設定でも dev サーバーがクラッシュしない」を保証する。
 */

type KvLike = {
  get: (key: string) => Promise<unknown>
  set: (key: string, value: unknown) => Promise<unknown>
  del: (key: string) => Promise<unknown>
  sadd: (key: string, ...members: string[]) => Promise<unknown>
  smembers: (key: string) => Promise<string[]>
  srem: (key: string, ...members: string[]) => Promise<unknown>
  exists: (key: string) => Promise<number>
}

function pickEnv(...keys: string[]): string | undefined {
  for (const k of keys) {
    const v = process.env[k]
    if (v && v.length > 0) return v
  }
  return undefined
}

const url = pickEnv('KV_REST_API_URL', 'UPSTASH_REDIS_REST_URL')
const token = pickEnv('KV_REST_API_TOKEN', 'UPSTASH_REDIS_REST_TOKEN')

let _kv: KvLike

if (url && token) {
  const client = new Redis({ url, token })
  _kv = {
    get: (k) => client.get(k),
    // Upstash の set は JSON.stringify 済みの文字列 or 値を受け取れる。
    // 我々はオブジェクトも突っ込みたいので、文字列化してから渡す（型安定のため）。
    set: (k, v) => client.set(k, typeof v === 'string' ? v : JSON.stringify(v)),
    del: (k) => client.del(k),
    sadd: (k, ...m) => client.sadd(k, ...m),
    smembers: (k) => client.smembers(k),
    srem: (k, ...m) => client.srem(k, ...m),
    exists: (k) => client.exists(k),
  }
} else {
  // ローカル開発用インメモリフォールバック。プロセス再起動で消える点に注意。
  // 本番では必ず上のブロックが走る。
  const g = globalThis as unknown as {
    __sedoriMemKv?: { map: Map<string, string>; sets: Map<string, Set<string>> }
  }
  if (!g.__sedoriMemKv) g.__sedoriMemKv = { map: new Map(), sets: new Map() }
  const mem = g.__sedoriMemKv

  _kv = {
    get: async (k) => {
      const raw = mem.map.get(k)
      if (raw == null) return null
      try { return JSON.parse(raw) } catch { return raw }
    },
    set: async (k, v) => {
      mem.map.set(k, typeof v === 'string' ? v : JSON.stringify(v))
      return 'OK'
    },
    del: async (k) => {
      const had = mem.map.delete(k) || mem.sets.delete(k)
      return had ? 1 : 0
    },
    sadd: async (k, ...members) => {
      let set = mem.sets.get(k)
      if (!set) { set = new Set(); mem.sets.set(k, set) }
      let added = 0
      for (const m of members) if (!set.has(m)) { set.add(m); added += 1 }
      return added
    },
    smembers: async (k) => {
      const set = mem.sets.get(k)
      return set ? Array.from(set) : []
    },
    srem: async (k, ...members) => {
      const set = mem.sets.get(k)
      if (!set) return 0
      let removed = 0
      for (const m of members) if (set.delete(m)) removed += 1
      return removed
    },
    exists: async (k) => (mem.map.has(k) || mem.sets.has(k)) ? 1 : 0,
  }
  if (process.env.NODE_ENV !== 'production') {
    console.warn('[kv] Upstash 環境変数が見つからないため、メモリフォールバックを使用しています。')
  }
}

export const kv = _kv

/** JSON として取得するヘルパ。null / undefined はそのまま返す。 */
export async function kvGetJson<T>(key: string): Promise<T | null> {
  const v = await kv.get(key)
  if (v == null) return null
  if (typeof v === 'string') {
    try { return JSON.parse(v) as T } catch { return null }
  }
  return v as T
}

/** JSON として保存するヘルパ。 */
export async function kvSetJson<T>(key: string, value: T): Promise<void> {
  await kv.set(key, JSON.stringify(value))
}
