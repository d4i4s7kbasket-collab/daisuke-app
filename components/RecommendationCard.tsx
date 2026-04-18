'use client'

import { useState } from 'react'
import { CheckCircle2, XCircle, Clock, ChevronRight, Star, ExternalLink, Search } from 'lucide-react'
import clsx from 'clsx'
import type { Recommendation } from '@/lib/types'
import { formatCurrency, getProfitColorClass, PLATFORM_SHORT, PLATFORM_LABELS } from '@/lib/calculations'
import { buildBuyCandidates, buildSellCandidates } from '@/lib/buyCandidates'
import LinkChoiceModal from './LinkChoiceModal'
import ProductImage from './ProductImage'

const STATUS = {
  pending:  { label: '承認待ち', icon: Clock,         color: 'bg-amber-100 text-amber-700' },
  approved: { label: '承認済',   icon: CheckCircle2,  color: 'bg-emerald-100 text-emerald-700' },
  rejected: { label: '見送り',   icon: XCircle,       color: 'bg-gray-100 text-gray-500' },
}

const BADGE: Record<string, string> = {
  amazon: 'bg-orange-100 text-orange-700',
  rakuten: 'bg-red-100 text-red-700',
  mercari: 'bg-pink-100 text-pink-700',
  yahoo: 'bg-purple-100 text-purple-700',
}

interface Props {
  rec: Recommendation
  onReview?: (rec: Recommendation) => void
}

export default function RecommendationCard({ rec, onReview }: Props) {
  const { product: p, status } = rec
  const { cost } = p
  const s = STATUS[status]
  const Icon = s.icon
  const isPending = status === 'pending'
  const [linkMode, setLinkMode] = useState<null | 'buy' | 'sell'>(null)

  return (
    <div
      className={clsx(
        'rounded-2xl border bg-white shadow-sm transition-all',
        isPending
          ? 'cursor-pointer hover:shadow-md border-indigo-200 active:scale-[0.99]'
          : 'border-gray-100 opacity-75'
      )}
      onClick={() => isPending && onReview?.(rec)}
    >
      <div className="p-4">
        <div className="flex items-start gap-3">
          {/* 画像 */}
          <div className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-xl bg-gray-50 border border-gray-100">
            <ProductImage src={p.imageUrl} alt={p.name} />
          </div>

          <div className="flex-1 min-w-0">
            {/* プラットフォームバッジ + ステータス */}
            <div className="flex flex-wrap items-center gap-1 mb-1">
              <span className={clsx('rounded-full px-2 py-0.5 text-[10px] font-bold', BADGE[p.sourcePlatform] ?? 'bg-gray-100 text-gray-600')}>
                仕入: {PLATFORM_SHORT[p.sourcePlatform]}
              </span>
              <span className="text-[10px] text-gray-300">→</span>
              <span className={clsx('rounded-full px-2 py-0.5 text-[10px] font-bold', BADGE[p.sellPlatform] ?? 'bg-gray-100 text-gray-600')}>
                販売: {PLATFORM_SHORT[p.sellPlatform]}
              </span>
              <span className={clsx('ml-auto flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[10px] font-medium', s.color)}>
                <Icon className="h-2.5 w-2.5" />{s.label}
              </span>
            </div>

            <p className="text-xs font-bold text-gray-900 line-clamp-2 leading-snug">{p.name}</p>

            <div className="mt-1 flex items-center gap-1">
              <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
              <span className="text-[10px] text-gray-500">{p.rating} ({p.reviewCount.toLocaleString()}件)</span>
            </div>
          </div>

          {isPending && <ChevronRight className="flex-shrink-0 h-4 w-4 text-gray-300 self-center" />}
        </div>

        {/* コスト内訳（コンパクト） */}
        <div className="mt-3 grid grid-cols-4 gap-1.5 rounded-xl bg-gray-50 p-2.5">
          {[
            { label: '仕入れ', value: formatCurrency(cost.buyPrice) },
            { label: '諸費用', value: formatCurrency(cost.purchaseShipping + cost.platformFee + cost.sellShipping) },
            { label: '販売(想定)', value: formatCurrency(cost.sellPrice) },
            { label: '純利益', value: formatCurrency(cost.profit), profit: true },
          ].map(({ label, value, profit }) => (
            <div key={label} className="text-center">
              <p className="text-[9px] text-gray-400 mb-0.5">{label}</p>
              <p className={clsx('text-[11px] font-medium', profit ? getProfitColorClass(cost.profitRate) + ' font-bold' : 'text-gray-700')}>{value}</p>
            </div>
          ))}
        </div>

        <div className="mt-2 flex items-center justify-between">
          <span className={clsx('text-xs font-bold', getProfitColorClass(cost.profitRate))}>
            利益率 {cost.profitRate.toFixed(1)}%
          </span>
          <span className="text-[11px] text-gray-400">
            {rec.buyQuantity}個 · 月{rec.estimatedMonthlySales}個想定
          </span>
        </div>
      </div>

      {/* 価格確認リンク（pending のみ） */}
      {isPending && (
        <div className="border-t border-dashed border-indigo-100 px-4 py-2.5 space-y-2">
          <p className="text-[11px] text-gray-500 leading-relaxed line-clamp-2">{rec.reason}</p>
          <div
            className="grid grid-cols-2 gap-1.5"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); setLinkMode('buy') }}
              className="flex items-center justify-center gap-1 rounded-lg border border-gray-200 bg-white py-1.5 text-[10px] font-bold text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <ExternalLink className="h-2.5 w-2.5" />
              {PLATFORM_SHORT[p.sourcePlatform]}で買値確認
            </button>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); setLinkMode('sell') }}
              className="flex items-center justify-center gap-1 rounded-lg border border-indigo-200 bg-indigo-50 py-1.5 text-[10px] font-bold text-indigo-700 hover:bg-indigo-100 transition-colors"
            >
              <Search className="h-2.5 w-2.5" />
              {PLATFORM_SHORT[p.sellPlatform]}の実売価格
            </button>
          </div>
        </div>
      )}

      {linkMode === 'buy' && (
        <LinkChoiceModal
          title={`${PLATFORM_LABELS[p.sourcePlatform]}で買値を確認`}
          subtitle={p.name}
          candidates={buildBuyCandidates(p)}
          onClose={() => setLinkMode(null)}
        />
      )}
      {linkMode === 'sell' && (
        <LinkChoiceModal
          title={`${PLATFORM_LABELS[p.sellPlatform]}で実売価格を確認`}
          subtitle={p.name}
          candidates={buildSellCandidates(p)}
          onClose={() => setLinkMode(null)}
        />
      )}
    </div>
  )
}
