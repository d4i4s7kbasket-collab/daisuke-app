import { DEFAULT_SETTINGS, type UserSettings } from './settings'
import { kvGetJson, kvSetJson } from './kv'

/**
 * アカウントごとのユーザー設定（都道府県、予算、予算調整履歴、名前 など）。
 * キー: `settings:{accountId}` -> UserSettings
 * 見つからなければ DEFAULT_SETTINGS を返す。書き込み時に初めて KV に入る。
 */

const key = (accountId: string) => `settings:${accountId}`

export async function getSettings(accountId: string): Promise<UserSettings> {
  const v = await kvGetJson<UserSettings>(key(accountId))
  if (!v) return DEFAULT_SETTINGS
  // 新しく増えたフィールドが無い古いデータにも耐えるようマージする
  return { ...DEFAULT_SETTINGS, ...v }
}

export async function putSettings(accountId: string, s: UserSettings): Promise<UserSettings> {
  await kvSetJson(key(accountId), s)
  return s
}
