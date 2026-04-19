import type { Recommendation } from './types'
import { MOCK_RECOMMENDATIONS } from './mockData'
import { kvGetJson, kvSetJson } from './kv'

/**
 * アカウントごとのAI仕入れ提案状態（approved/rejected フラグなど）。
 * キー: `recs:{accountId}` -> Recommendation[]
 * 初回は MOCK_RECOMMENDATIONS をシードする。
 */

const key = (accountId: string) => `recs:${accountId}`

export async function listRecommendations(accountId: string): Promise<Recommendation[]> {
  const existing = await kvGetJson<Recommendation[]>(key(accountId))
  if (existing === null) {
    const seed = [...MOCK_RECOMMENDATIONS]
    await kvSetJson(key(accountId), seed)
    return seed
  }
  return existing
}

export async function updateRecommendationStatus(
  accountId: string,
  id: string,
  status: Recommendation['status'],
): Promise<Recommendation | null> {
  const existing = await listRecommendations(accountId)
  let updated: Recommendation | null = null
  const next = existing.map((r) => {
    if (r.id !== id) return r
    updated = { ...r, status }
    return updated
  })
  if (!updated) return null
  await kvSetJson(key(accountId), next)
  return updated
}
