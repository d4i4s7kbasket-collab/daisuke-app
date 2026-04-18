'use client'

import { useState } from 'react'
import { ExternalLink, Star, ArrowRight, Search, Info } from 'lucide-react'
import clsx from 'clsx'
import type { Product } from '@/lib/types'
import { formatCurrency, getProfitColorClass, getProfitBadgeClass, getVelocityBadgeClass, getVelocityLabel, PLATFORM_SHORT, PLATFORM_LABELS } from '@/lib/calculations'
import { buildBuyCandidates, buildSellCandidates } from '@/lib/buyCandidates'
import LinkChoiceModal from './LinkChoiceModal'
import ProductImage from './ProductImage'

const SOURCE_COLORS: Record<string, string> = {
  amazon: 'bg-orange-100 text-orange-700',
  rakuten: 'bg-red-100 text-red-700',
  mercari: 'bg-pink-100 text-pink-700',
  yahoo: 'bg-purple-100 text-purple-700',
  paypay: 'bg-red-50 text-red-500',
}

interface ProductCardProps {
  product: Product
}

export default function ProductCard({ product: p }: ProductCardProps) {
  const { cost } = p
  const [linkMode, setLinkMode] = useState<null | 'buy' | 'sell'>(null)
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex gap-3">
        <div className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-xl bg-gray-50 border border-gray-100">
          <ProductImage src={p.imageUrl} alt={p.name} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-bold text-gray-900 line-clamp-2 leading-snug">{p.name}</p>
          <div className="mt-1.5 flex flex-wrap items-center gap-1">
            <span className={clsx('rounded-full px-2 py-0.5 text-[10px] font-bold', SOURCE_COLORS[p.sourcePlatform] ?? 'bg-gray-100 text-gray-600')}>
              {PLATFORM_SHORT[p.sourcePlatform]}
            </span>
            <ArrowRight className="h-2.5 w-2.5 text-gray-300" />
            <span className={clsx('rounded-full px-2 py-0.5 text-[10px] font-bold', SOURCE_COLORS[p.sellPlatform] ?? 'bg-gray-100 text-gray-600')}>
              {PLATFORM_SHORT[p.sellPlatform]}
            </span>
            <span className={clsx('rounded-full px-2 py-0.5 text-[10px] font-medium', getVelocityBadgeClass(p.salesVelocity))}>
              {getVelocityLabel(p.salesVelocity)}
            </span>
          </div>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-4 gap-1 rounded-xl bg-gray-50 p-2.5 text-center">
        {[
          { label: '仕入れ', value: formatCurrency(cost.buyPrice) },
          { label: '諸費用', value: formatCurrency(cost.purchaseShipping + cost.platformFee + cost.sellShipping) },
          { label: '販売', value: formatCurrency(cost.sellPrice), estimate: true },
          { label: '純利益', value: formatCurrency(cost.profit), highlight: true },
        ].map(({ label, value, highlight, estimate }) => (
          <div key={label}>
            <p className="text-[9px] text-gray-400 flex items-center justify-center gap-0.5">
              {label}{estimate && <Info className="h-2 w-2 text-amber-500" />}
            </p>
            <p className={clsx('text-[11px] font-medium', highlight ? getProfitColorClass(cost.profitRate) + ' font-bold' : 'text-gray-700')}>{value}</p>
          </div>
        ))}
      </div>

      <div className="mt-2.5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className={clsx('rounded-full px-2 py-0.5 text-[10px] font-bold', getProfitBadgeClass(cost.profitRate))}>
            {cost.profitRate.toFixed(1)}%
          </span>
          <div className="flex items-center gap-0.5">
            <Star className="h-2.5 w-2.5 fill-amber-400 text-amber-400" />
            <span className="text-[10px] text-gray-400">{p.rating}</span>
          </div>
        </div>
      </div>

      <div className="mt-2 grid grid-cols-2 gap-1.5">
        <button
          type="button"
          onClick={() => setLinkMode('buy')}
          className="flex items-center justify-center gap-1 rounded-lg border border-gray-200 bg-white py-1.5 text-[10px] font-bold text-gray-700 hover:bg-gray-50 transition-colors"
        >
          <ExternalLink className="h-2.5 w-2.5" />
          {PLATFORM_SHORT[p.sourcePlatform]}の買値
        </button>
        <button
          type="button"
          onClick={() => setLinkMode('sell')}
          className="flex items-center justify-center gap-1 rounded-lg border border-indigo-200 bg-indigo-50 py-1.5 text-[10px] font-bold text-indigo-700 hover:bg-indigo-100 transition-colors"
        >
          <Search className="h-2.5 w-2.5" />
          {PLATFORM_SHORT[p.sellPlatform]}の実売価格
        </button>
      </div>

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
