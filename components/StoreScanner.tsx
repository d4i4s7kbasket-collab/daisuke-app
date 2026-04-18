'use client'

import { useRef, useState } from 'react'
import { Camera, Search, X, ExternalLink, Trophy, AlertTriangle, RefreshCw } from 'lucide-react'
import clsx from 'clsx'
import type { ScanResult, Platform } from '@/lib/types'
import { buildScanResult } from '@/lib/storeScan'
import { formatCurrency, getProfitColorClass, PLATFORM_SHORT, PLATFORM_LABELS } from '@/lib/calculations'
import { sellPriceCheckUrl } from '@/lib/deepLinks'

const PLATFORM_BADGE: Record<string, string> = {
  mercari: 'bg-pink-100 text-pink-700 border-pink-200',
  amazon: 'bg-orange-100 text-orange-700 border-orange-200',
  rakuten: 'bg-red-100 text-red-700 border-red-200',
  yahoo: 'bg-purple-100 text-purple-700 border-purple-200',
}

const CONFIDENCE_LABEL = {
  high: { label: '相場推定・高', color: 'text-emerald-600' },
  medium: { label: '相場推定・中', color: 'text-amber-600' },
  low: { label: '相場推定・低', color: 'text-rose-600' },
} as const

export default function StoreScanner() {
  const fileRef = useRef<HTMLInputElement>(null)
  const [imageDataUrl, setImageDataUrl] = useState<string | undefined>(undefined)
  const [query, setQuery] = useState('')
  const [price, setPrice] = useState<string>('')
  const [result, setResult] = useState<ScanResult | null>(null)

  const onPhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => setImageDataUrl(reader.result as string)
    reader.readAsDataURL(file)
  }

  const reset = () => {
    setImageDataUrl(undefined)
    setQuery('')
    setPrice('')
    setResult(null)
    if (fileRef.current) fileRef.current.value = ''
  }

  const onScan = () => {
    const p = parseInt(price, 10)
    if (!query.trim() || !Number.isFinite(p) || p <= 0) return
    setResult(buildScanResult({ query: query.trim(), inStorePrice: p, imageDataUrl }))
  }

  return (
    <div className="space-y-4">
      {/* ガイド */}
      <div className="rounded-2xl border border-indigo-100 bg-indigo-50/60 p-3.5">
        <p className="text-xs font-bold text-indigo-700 mb-1">店舗せどりモード</p>
        <p className="text-[11px] text-indigo-600 leading-relaxed">
          ① 商品の写真を撮る → ② 商品名と店頭価格を入力 → ③ Amazon・楽天・メルカリ・Yahoo! での利益を一括比較
        </p>
      </div>

      {/* 写真 + 入力 */}
      <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm space-y-3">
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={onPhoto}
        />

        {imageDataUrl ? (
          <div className="relative">
            <img
              src={imageDataUrl}
              alt="撮影した商品"
              className="w-full h-48 object-cover rounded-xl bg-gray-100"
            />
            <button
              onClick={() => setImageDataUrl(undefined)}
              className="absolute top-2 right-2 rounded-full bg-white/90 p-1.5 shadow"
              aria-label="写真を削除"
            >
              <X className="h-3.5 w-3.5 text-gray-700" />
            </button>
          </div>
        ) : (
          <button
            onClick={() => fileRef.current?.click()}
            className="w-full h-36 rounded-xl border-2 border-dashed border-indigo-200 bg-indigo-50/50 flex flex-col items-center justify-center gap-2 hover:border-indigo-400 active:scale-[0.99] transition-all"
          >
            <Camera className="h-8 w-8 text-indigo-500" />
            <p className="text-xs font-bold text-indigo-700">カメラで商品を撮影</p>
            <p className="text-[10px] text-indigo-400">（タップでカメラ起動・画像選択も可）</p>
          </button>
        )}

        <div className="space-y-2">
          <div>
            <label className="text-[10px] font-semibold text-gray-500 block mb-1">
              商品名（または JANコード）
            </label>
            <input
              type="text"
              inputMode="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="例: ポケモンカード 151 BOX"
              className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
            />
          </div>
          <div>
            <label className="text-[10px] font-semibold text-gray-500 block mb-1">店頭価格（円）</label>
            <input
              type="number"
              inputMode="numeric"
              pattern="[0-9]*"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="例: 3000"
              className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
            />
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={onScan}
            disabled={!query.trim() || !price}
            className={clsx(
              'flex-1 rounded-xl py-3 text-sm font-bold transition-all flex items-center justify-center gap-2',
              !query.trim() || !price
                ? 'bg-gray-100 text-gray-300 cursor-not-allowed'
                : 'bg-indigo-600 text-white hover:bg-indigo-700 active:scale-95'
            )}
          >
            <Search className="h-4 w-4" />
            各プラットフォームで比較
          </button>
          {(result || imageDataUrl || query || price) && (
            <button
              onClick={reset}
              className="rounded-xl border border-gray-200 px-3 py-3 text-xs text-gray-500 hover:bg-gray-50"
              aria-label="リセット"
            >
              <RefreshCw className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* スキャン結果 */}
      {result && <ScanResultView result={result} />}
    </div>
  )
}

function ScanResultView({ result }: { result: ScanResult }) {
  const sorted = [...result.quotes].sort((a, b) => b.profit - a.profit)

  return (
    <div className="space-y-3">
      {/* ベストプラットフォーム */}
      <div className="rounded-2xl border-2 border-emerald-200 bg-gradient-to-br from-emerald-50 to-white p-4 shadow-sm">
        <div className="flex items-center gap-2 mb-2">
          <Trophy className="h-4 w-4 text-emerald-600" />
          <p className="text-[11px] font-bold text-emerald-700">最も利益が出そうな販売先</p>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-xl font-bold text-gray-900">{PLATFORM_LABELS[result.bestPlatform]}</span>
          <span className={clsx('text-2xl font-bold', getProfitColorClass(sorted[0].profitRate))}>
            +{formatCurrency(sorted[0].profit)}
          </span>
        </div>
        <p className="text-[10px] text-gray-500 mt-0.5">
          店頭価格 {formatCurrency(result.inStorePrice)} で仕入れた場合の1個あたり純利益
        </p>
      </div>

      {/* 注意喚起 */}
      <div className="rounded-xl bg-amber-50 border border-amber-200 p-3 flex items-start gap-2">
        <AlertTriangle className="h-4 w-4 text-amber-600 flex-shrink-0 mt-0.5" />
        <p className="text-[11px] text-amber-800 leading-relaxed">
          表示の販売価格はキーワードからの<strong>相場推定</strong>です。
          購入前に必ず各プラットフォームのリンクから<strong>実際の売り切れ価格</strong>を確認してください。
        </p>
      </div>

      {/* 全プラットフォーム比較 */}
      <div className="space-y-2">
        {sorted.map((q) => (
          <PlatformRow key={q.platform} q={q} query={result.query} isBest={q.platform === result.bestPlatform} />
        ))}
      </div>
    </div>
  )
}

function PlatformRow({
  q, query, isBest,
}: {
  q: import('@/lib/types').PlatformQuote
  query: string
  isBest: boolean
}) {
  // 実売価格を確認するURL（疑似的な Product を作って sellPriceCheckUrl 流用）
  const checkUrl = sellPriceCheckUrl({
    id: 'scan',
    name: query,
    imageUrl: '',
    url: '',
    category: '',
    sourcePlatform: 'amazon',
    sellPlatform: q.platform as Platform,
    cost: {} as import('@/lib/types').CostBreakdown,
    salesVelocity: 'medium',
    rank: 0,
    reviewCount: 0,
    rating: 0,
    lastUpdated: '',
  }, q.platform as Platform)

  const conf = CONFIDENCE_LABEL[q.confidence]

  return (
    <div
      className={clsx(
        'rounded-2xl border bg-white p-3 shadow-sm',
        isBest ? 'border-emerald-300 ring-1 ring-emerald-200' : 'border-gray-200'
      )}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className={clsx('rounded-full border px-2 py-0.5 text-[11px] font-bold', PLATFORM_BADGE[q.platform] ?? 'bg-gray-100')}>
            {PLATFORM_LABELS[q.platform]}
          </span>
          {isBest && <span className="text-[10px] font-bold text-emerald-600">★ ベスト</span>}
        </div>
        <span className={clsx('text-[10px] font-semibold', conf.color)}>{conf.label}</span>
      </div>

      <div className="grid grid-cols-4 gap-1.5 rounded-xl bg-gray-50 p-2.5 text-center">
        <div>
          <p className="text-[9px] text-gray-400 mb-0.5">想定販売</p>
          <p className="text-[11px] font-bold text-gray-800">{formatCurrency(q.sellPrice)}</p>
        </div>
        <div>
          <p className="text-[9px] text-gray-400 mb-0.5">手数料</p>
          <p className="text-[11px] text-gray-600">−{formatCurrency(q.platformFee)}</p>
        </div>
        <div>
          <p className="text-[9px] text-gray-400 mb-0.5">発送</p>
          <p className="text-[11px] text-gray-600">−{formatCurrency(q.sellShipping)}</p>
        </div>
        <div>
          <p className="text-[9px] text-gray-400 mb-0.5">純利益</p>
          <p className={clsx('text-[12px] font-bold', getProfitColorClass(q.profitRate))}>
            {q.profit >= 0 ? '+' : ''}{formatCurrency(q.profit)}
          </p>
        </div>
      </div>

      <div className="mt-2 flex items-center justify-between gap-2">
        <span className={clsx('text-xs font-bold', getProfitColorClass(q.profitRate))}>
          利益率 {q.profitRate.toFixed(1)}%
        </span>
        <a
          href={checkUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-1.5 text-[10px] font-bold text-indigo-700 hover:bg-indigo-100"
        >
          <ExternalLink className="h-2.5 w-2.5" />
          {PLATFORM_SHORT[q.platform]}の実売を見る
        </a>
      </div>
    </div>
  )
}
