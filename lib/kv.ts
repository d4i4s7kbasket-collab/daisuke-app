import { Redis } from '@upstash/redis'

/**
 * Upstash Redis クライアント。
 *
 * 本番（Vercel）では Upstash インテグレーションが設定した
 * KV_REST_API_URL / KV_REST_API_TOKEN を自動で使う。
 * 環境変数が無い場合（ローカル開発で未設定な時）は、
 * プロセス内のメモリに書くフォールバックで代替する。
 */

type KvLike = {
  get: (key: string) => Promise<unknown>
  set: (key: string, value: unknown) => Promise<unknown>
  del: (key: string) => Promise<unknown>
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
    set: (k, v) => client.set(k, typeof v === 'string' ? v : JSON.stringify(v)),
    del: (k) => client.del(k),
    exists: (k) => client.exists(k),
  }
} else {
  const g = globalThis as unknown as { __sedoriMemKv?: Map<string, string> }
  if (!g.__sedoriMemKv) g.__sedoriMemKv = new Map<string, string>()
  const mem = g.__sedoriMemKv

  _kv = {
    get: async (k) => {
      const raw = mem.get(k)
      if (raw == null) return null
      try { return JSON.parse(raw) } catch { return raw }
    },
    set: async (k, v) => {
      mem.set(k, typeof v === 'string' ? v : JSON.stringify(v))
      return 'OK'
    },
    del: async (k) => (mem.delete(k) ? 1 : 0),
    exists: async (k) => (mem.has(k) ? 1 : 0),
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
