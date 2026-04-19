import type { SalesRecord } from './types'
import { MOCK_SALES } from './mockData'
import { kvGetJson, kvSetJson } from './kv'

/**
 * アカウントごとの販売記録。
 * キー: `sales:{accountId}` -> SalesRecord[]
 * 新規アカウントには MOCK_SALES をシードして、最初からグラフが見える形にする。
 */

const key = (accountId: string) => `sales:${accountId}`

export async function listSales(accountId: string): Promise<SalesRecord[]> {
  const existing = await kvGetJson<SalesRecord[]>(key(accountId))
  if (existing === null) {
    const seed = [...MOCK_SALES]
    await kvSetJson(key(accountId), seed)
    return seed
  }
  return existing
}

export async function addSale(accountId: string, record: SalesRecord): Promise<SalesRecord> {
  const existing = await listSales(accountId)
  const next = [record, ...existing]
  await kvSetJson(key(accountId), next)
  return record
}
