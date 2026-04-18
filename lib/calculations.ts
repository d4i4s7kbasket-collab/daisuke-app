import type { CostBreakdown, Platform } from './types'
import { getAverageShippingCost } from './shipping'
import type { Prefecture } from './shipping'

export const PLATFORM_FEES: Record<string, number> = {
  rakuten: 0.10,
  amazon: 0.15,
  mercari: 0.10,
  yahoo: 0.08,
  paypay: 0.05,
}

export const PLATFORM_LABELS: Record<string, string> = {
  rakuten: '楽天市場',
  amazon: 'Amazon',
  mercari: 'メルカリ',
  yahoo: 'Yahoo!ショッピング',
  paypay: 'PayPayフリマ',
}

export const PLATFORM_SHORT: Record<string, string> = {
  rakuten: '楽天',
  amazon: 'Amazon',
  mercari: 'メルカリ',
  yahoo: 'Yahoo!',
  paypay: 'PayPay',
}

export function calcCost(
  buyPrice: number,
  sellPrice: number,
  sellPlatform: Platform,
  purchaseShipping: number,
  userPrefecture?: Prefecture
): CostBreakdown {
  const platformFee = Math.round(sellPrice * (PLATFORM_FEES[sellPlatform] ?? 0.10))
  // 発送費用: ユーザーの地域から全国平均、未設定なら930円
  const sellShipping = userPrefecture
    ? getAverageShippingCost(userPrefecture)
    : 930
  const totalCost = buyPrice + purchaseShipping + platformFee + sellShipping
  const profit = sellPrice - totalCost
  const profitRate = (buyPrice + purchaseShipping) > 0
    ? (profit / (buyPrice + purchaseShipping)) * 100
    : 0

  return { buyPrice, purchaseShipping, platformFee, sellShipping, totalCost, sellPrice, profit, profitRate }
}

export function estimateSellPrice(
  buyPrice: number,
  purchaseShipping: number,
  targetProfitRate: number,
  sellPlatform: Platform,
  userPrefecture?: Prefecture
): number {
  const feeRate = PLATFORM_FEES[sellPlatform] ?? 0.10
  const shipping = userPrefecture ? getAverageShippingCost(userPrefecture) : 930
  const totalInvestment = buyPrice + purchaseShipping
  const targetProfit = totalInvestment * (targetProfitRate / 100)
  return Math.ceil((totalInvestment + targetProfit + shipping) / (1 - feeRate))
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('ja-JP', { style: 'currency', currency: 'JPY', maximumFractionDigits: 0 }).format(amount)
}

export function getProfitColorClass(rate: number): string {
  if (rate >= 25) return 'text-emerald-600'
  if (rate >= 12) return 'text-amber-600'
  return 'text-red-500'
}

export function getProfitBadgeClass(rate: number): string {
  if (rate >= 25) return 'bg-emerald-100 text-emerald-700'
  if (rate >= 12) return 'bg-amber-100 text-amber-700'
  return 'bg-red-100 text-red-600'
}

export function getVelocityLabel(v: string): string {
  return { high: '売れ筋', medium: '普通', low: '低速' }[v] ?? v
}

export function getVelocityBadgeClass(v: string): string {
  return {
    high: 'bg-emerald-100 text-emerald-700',
    medium: 'bg-amber-100 text-amber-700',
    low: 'bg-red-100 text-red-600',
  }[v] ?? ''
}

export function getTrendIcon(trend: string): string {
  return { rising: '↑', stable: '→', falling: '↓' }[trend] ?? '→'
}

export function getTrendColorClass(trend: string): string {
  return { rising: 'text-emerald-600', stable: 'text-gray-500', falling: 'text-red-500' }[trend] ?? 'text-gray-500'
}
