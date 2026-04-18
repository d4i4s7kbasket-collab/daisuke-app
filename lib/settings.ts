import type { Prefecture } from './shipping'

export interface UserSettings {
  prefecture: Prefecture
  name: string
  monthlyBudget: number
}

export const DEFAULT_SETTINGS: UserSettings = {
  prefecture: '東京',
  name: '',
  monthlyBudget: 100000,
}
