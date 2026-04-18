import type { InventoryItem } from './types'

/**
 * 今月の仕入れコストを在庫データから算出する。
 * 在庫購入日（purchasedAt）が今月のもののみ対象。
 */
export function monthlySpent(items: InventoryItem[], now = new Date()): number {
  const y = now.getFullYear()
  const m = now.getMonth()
  return items.reduce((sum, it) => {
    const d = new Date(it.purchasedAt)
    if (d.getFullYear() !== y || d.getMonth() !== m) return sum
    return sum + (it.product.cost.buyPrice + it.product.cost.purchaseShipping) * it.quantity
  }, 0)
}

export function budgetStatus(monthlyBudget: number, spent: number) {
  const remaining = monthlyBudget - spent
  const usedRate = monthlyBudget > 0 ? (spent / monthlyBudget) * 100 : 0
  const level: 'safe' | 'warn' | 'over' =
    usedRate >= 100 ? 'over' : usedRate >= 75 ? 'warn' : 'safe'
  return { spent, remaining, usedRate, level }
}
