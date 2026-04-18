import type { InventoryItem } from './types'
import type { BudgetAdjustment } from './settings'

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

/** 今月分の予算調整（追加・削減）の合計 */
export function monthlyAdjustments(
  adjustments: BudgetAdjustment[] | undefined,
  now = new Date(),
): number {
  if (!adjustments || adjustments.length === 0) return 0
  const y = now.getFullYear()
  const m = now.getMonth()
  return adjustments.reduce((sum, a) => {
    const d = new Date(a.at)
    if (d.getFullYear() !== y || d.getMonth() !== m) return sum
    return sum + a.amount
  }, 0)
}

/** 基礎予算 + 今月分の手動調整 = 実効予算 */
export function effectiveBudget(
  monthlyBudget: number,
  adjustments: BudgetAdjustment[] | undefined,
  now = new Date(),
): number {
  return monthlyBudget + monthlyAdjustments(adjustments, now)
}

export function budgetStatus(monthlyBudget: number, spent: number) {
  const remaining = monthlyBudget - spent
  const usedRate = monthlyBudget > 0 ? (spent / monthlyBudget) * 100 : 0
  const level: 'safe' | 'warn' | 'over' =
    usedRate >= 100 ? 'over' : usedRate >= 75 ? 'warn' : 'safe'
  return { spent, remaining, usedRate, level }
}
