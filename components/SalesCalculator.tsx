'use client'

import { useState } from 'react'
import { Package } from 'lucide-react'
import { calcCost, estimateSellPrice, formatCurrency, PLATFORM_FEES, PLATFORM_LABELS } from '@/lib/calculations'
import type { Platform } from '@/lib/types'
import type { UserSettings } from '@/lib/settings'

const PLATFORMS = Object.keys(PLATFORM_FEES) as Platform[]

interface Props {
  settings: UserSettings
}

export default function SalesCalculator({ settings }: Props) {
  const [buyPrice, setBuyPrice] = useState('')
  const [sellPrice, setSellPrice] = useState('')
  const [purchaseShipping, setPurchaseShipping] = useState('0')
  const [platform, setPlatform] = useState<Platform>('mercari')
  const [mode, setMode] = useState<'calc' | 'target'>('calc')
  const [targetRate, setTargetRate] = useState('20')

  const buy = Number(buyPrice) || 0
  const sell = Number(sellPrice) || 0
  const pShip = Number(purchaseShipping) || 0

  const result = buy > 0 && sell > 0 ? calcCost(buy, sell, platform, pShip, settings.prefecture) : null
  const recommended = buy > 0 ? estimateSellPrice(buy, pShip, Number(targetRate), platform, settings.prefecture) : 0

  return (
    <div className="rounded-2xl border bg-white p-5 shadow-sm">
      <div className="flex items-center gap-2 mb-4">
        <Package className="h-4 w-4 text-indigo-500" />
        <h3 className="text-sm font-semibold text-gray-700">利益計算ツール</h3>
        <span className="ml-auto text-[10px] text-gray-400 bg-gray-100 rounded-full px-2 py-0.5">{settings.prefecture}発送</span>
      </div>

      <div className="flex rounded-xl overflow-hidden border mb-4 text-xs font-medium">
        {(['calc', 'target'] as const).map((m) => (
          <button key={m} onClick={() => setMode(m)}
            className={`flex-1 py-2 transition-colors ${mode === m ? 'bg-indigo-600 text-white' : 'text-gray-500 hover:bg-gray-50'}`}>
            {m === 'calc' ? '利益計算' : '目標設定'}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        <label className="block text-xs text-gray-500">販売プラットフォーム
          <select value={platform} onChange={(e) => setPlatform(e.target.value as Platform)}
            className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-white">
            {PLATFORMS.map((p) => <option key={p} value={p}>{PLATFORM_LABELS[p]}</option>)}
          </select>
        </label>
        <label className="block text-xs text-gray-500">仕入れ価格（円）
          <input type="number" value={buyPrice} onChange={(e) => setBuyPrice(e.target.value)}
            placeholder="例: 5000"
            className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300" />
        </label>
        <label className="block text-xs text-gray-500">仕入れ送料（円、無料なら0）
          <input type="number" value={purchaseShipping} onChange={(e) => setPurchaseShipping(e.target.value)}
            placeholder="例: 500"
            className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300" />
        </label>
        {mode === 'calc' ? (
          <label className="block text-xs text-gray-500">販売価格（円）
            <input type="number" value={sellPrice} onChange={(e) => setSellPrice(e.target.value)}
              placeholder="例: 8000"
              className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300" />
          </label>
        ) : (
          <label className="block text-xs text-gray-500">目標利益率（%）
            <input type="number" value={targetRate} onChange={(e) => setTargetRate(e.target.value)}
              placeholder="20"
              className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300" />
          </label>
        )}
      </div>

      {mode === 'calc' && result && (
        <div className="mt-4 rounded-xl border border-gray-100 overflow-hidden divide-y divide-gray-50">
          <Row label="仕入れ価格" value={formatCurrency(result.buyPrice)} />
          {result.purchaseShipping > 0 && <Row label="仕入れ送料" value={formatCurrency(result.purchaseShipping)} />}
          <Row label="販売手数料" value={formatCurrency(result.platformFee)} />
          <Row label={`発送費用（${settings.prefecture}発送・全国平均）`} value={formatCurrency(result.sellShipping)} />
          <Row label="販売価格" value={formatCurrency(result.sellPrice)} accent />
          <div className="bg-gray-50 px-3 py-2.5 flex justify-between">
            <span className="text-xs font-bold text-gray-700">純利益</span>
            <span className={`text-sm font-bold ${result.profit >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
              {formatCurrency(result.profit)}（{result.profitRate.toFixed(1)}%）
            </span>
          </div>
        </div>
      )}

      {mode === 'target' && buy > 0 && (
        <div className="mt-4 rounded-xl bg-indigo-50 border border-indigo-100 p-4">
          <p className="text-[10px] text-indigo-500 mb-1">利益率 {targetRate}% 達成のための推奨販売価格</p>
          <p className="text-xl font-bold text-indigo-700">{formatCurrency(Math.ceil(recommended))}</p>
          <p className="text-[10px] text-indigo-400 mt-1">{settings.prefecture}発送・全国平均配送料を含む</p>
        </div>
      )}
    </div>
  )
}

function Row({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className={`flex justify-between px-3 py-2 ${accent ? 'bg-gray-50' : ''}`}>
      <span className="text-xs text-gray-500">{label}</span>
      <span className={`text-xs ${accent ? 'font-bold text-gray-800' : 'font-medium text-gray-700'}`}>{value}</span>
    </div>
  )
}
