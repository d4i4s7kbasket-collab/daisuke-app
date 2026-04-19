import type { InventoryItem, Product, InventoryStatus } from './types'
import { MOCK_PRODUCTS } from './mockData'
import { kvGetJson, kvSetJson } from './kv'

/**
 * アカウントごとの在庫データを Upstash Redis (KV) に保存する。
 *
 * キー: `inv:{accountId}` -> InventoryItem[]
 *
 * 新規アカウントは「サンプルシード2件」で初期化し、
 * アプリを開いた瞬間に空っぽに見えないようにする。
 * （既存ユーザーを上書きしないよう、キーが存在しない時だけシードする。）
 */

function seed(): InventoryItem[] {
  return [
    {
      id: 'inv-seed-1',
      product: MOCK_PRODUCTS[3],
      quantity: 3,
      remaining: 2,
      purchasedAt: new Date(Date.now() - 4 * 86400000).toISOString(),
      listedPrice: MOCK_PRODUCTS[3].cost.sellPrice,
      status: 'listed',
      memo: '',
    },
    {
      id: 'inv-seed-2',
      product: MOCK_PRODUCTS[2],
      quantity: 5,
      remaining: 5,
      purchasedAt: new Date(Date.now() - 1 * 86400000).toISOString(),
      status: 'in_stock',
      memo: '小分け販売予定',
    },
  ]
}

const key = (accountId: string) => `inv:${accountId}`

async function readAll(accountId: string): Promise<InventoryItem[]> {
  const items = await kvGetJson<InventoryItem[]>(key(accountId))
  if (items === null) {
    // 初回アクセス時はシード
    const s = seed()
    await kvSetJson(key(accountId), s)
    return s
  }
  return items
}

async function writeAll(accountId: string, items: InventoryItem[]): Promise<void> {
  await kvSetJson(key(accountId), items)
}

export async function listInventory(accountId: string): Promise<InventoryItem[]> {
  return readAll(accountId)
}

export async function addInventory(
  accountId: string, product: Product, quantity: number, memo?: string,
): Promise<InventoryItem> {
  const items = await readAll(accountId)
  const item: InventoryItem = {
    id: `inv-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    product,
    quantity,
    remaining: quantity,
    purchasedAt: new Date().toISOString(),
    status: 'in_stock',
    memo,
  }
  await writeAll(accountId, [item, ...items])
  return item
}

export async function updateInventory(
  accountId: string,
  id: string,
  patch: Partial<Pick<InventoryItem, 'status' | 'remaining' | 'listedPrice' | 'memo'>>,
): Promise<InventoryItem | null> {
  const items = await readAll(accountId)
  let updated: InventoryItem | null = null
  const next = items.map((it) => {
    if (it.id !== id) return it
    updated = { ...it, ...patch }
    return updated
  })
  if (!updated) return null
  await writeAll(accountId, next)
  return updated
}

export async function removeInventory(accountId: string, id: string): Promise<boolean> {
  const items = await readAll(accountId)
  const next = items.filter((it) => it.id !== id)
  if (next.length === items.length) return false
  await writeAll(accountId, next)
  return true
}

export function inventoryStats(items: InventoryItem[]) {
  const totalUnits = items.reduce((sum, i) => sum + i.remaining, 0)
  const totalCost = items.reduce(
    (sum, i) => sum + (i.product.cost.buyPrice + i.product.cost.purchaseShipping) * i.remaining,
    0
  )
  const expectedRevenue = items.reduce(
    (sum, i) => sum + (i.listedPrice ?? i.product.cost.sellPrice) * i.remaining,
    0
  )
  const expectedProfit = items.reduce(
    (sum, i) => sum + i.product.cost.profit * i.remaining,
    0
  )
  const byStatus: Record<InventoryStatus, number> = { in_stock: 0, listed: 0, sold: 0, returned: 0 }
  items.forEach((i) => { byStatus[i.status] += 1 })
  return { totalUnits, totalCost, expectedRevenue, expectedProfit, byStatus }
}
