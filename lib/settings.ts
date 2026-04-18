import type { Prefecture } from './shipping'

/** 月の途中で予算を足したり調整したりする記録。金額は正負OK（+で追加、-で削減） */
export interface BudgetAdjustment {
  id: string
  /** 金額。+追加／-削減 */
  amount: number
  note?: string
  /** ISO日時 */
  at: string
}

export interface UserSettings {
  prefecture: Prefecture
  name: string
  /** 毎月の基礎予算 */
  monthlyBudget: number
  /** 手動で追加／調整した予算の履歴 */
  budgetAdjustments?: BudgetAdjustment[]
}

export const DEFAULT_SETTINGS: UserSettings = {
  prefecture: '東京',
  name: '',
  monthlyBudget: 100000,
  budgetAdjustments: [],
}
