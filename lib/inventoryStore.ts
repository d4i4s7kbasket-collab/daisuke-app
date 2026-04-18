import type { InventoryItem, Product, InventoryStatus } from './types'
import { MOCK_PRODUCTS } from './mockData'

/**
 * 在庫データ（インメモリ）。
 * 本番では DB に置き換え想定。Next.js dev ではモジュールスコープに保持する。
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

type Store = { items: InventoryItem[] }
const globalStore = globalThis as unknown as { __sedoriInventory?: Store }
if (!globalStore.__sedoriInventory) globalStore.__sedoriInventory = { items: seed() }
const store = globalStore.__sedoriInventory

export function listInventory(): InventoryItem[] {
  return store.items
}

export function addInventory(product: Product, quantity: number, memo?: string): InventoryItem {
  const item: InventoryItem = {
    id: `inv-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    product,
    quantity,
    remaining: quantity,
    purchasedAt: new Date().toISOString(),
    status: 'in_stock',
    memo,
  }
  store.items = [item, ...store.items]
  return item
}

export function updateInventory(
  id: string,
  patch: Partial<Pick<InventoryItem, 'status' | 'remaining' | 'listedPrice' | 'memo'>>
): InventoryItem | null {
  let updated: InventoryItem | null = null
  store.items = store.items.map((it) => {
    if (it.id !== id) return it
    updated = { ...it, ...patch }
    return updated
  })
  return updated
}

export function removeInventory(id: string): boolean {
  const before = store.items.length
  store.items = store.items.filter((it) => it.id !== id)
  return store.items.length < before
}

export function inventoryStats(items: InventoryItem[] = listInventory()) {
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
