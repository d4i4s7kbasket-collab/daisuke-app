'use client'

import { useMemo, useState } from 'react'
import { Store, MapPin, TrendingUp, ExternalLink } from 'lucide-react'
import clsx from 'clsx'
import type { StoreDeal, StoreType } from '@/lib/types'
import { STORE_DEALS, STORE_LABELS, STORE_COLORS, DIFFICULTY_LABELS, dealsByStore } from '@/lib/storeDeals'
import { formatCurrency, PLATFORM_LABELS, PLATFORM_SHORT } from '@/lib/calculations'
import { buildSellCandidatesFromQuery } from '@/lib/buyCandidates'
import LinkChoiceModal from './LinkChoiceModal'

const ALL_STORE_KEYS: StoreType[] = [
  'bookoff', 'hardoff', 'donki', 'yamada', 'bic', 'toysrus', 'geo', 'recycle', 'super', 'outlet',
]

export default function StoreDealList() {
  const [filter, setFilter] = useState<StoreType | 'all'>('all')

  const deals = useMemo(() => {
    if (filter === 'all') return STORE_DEALS
    return dealsByStore(STORE_DEALS, filter)
  }, [filter])

  return (
    <div className="space-y-3">
      <div className="rounded-2xl border border-amber-100 bg-amber-50/60 p-3.5">
        <div className="flex items-center gap-1.5 mb-1">
          <TrendingUp className="h-3.5 w-3.5 text-amber-600" />
          <p className="text-xs font-bold text-amber-700">店舗で見つかる高利益商品</p>
        </div>
        <p className="text-[11px] text-amber-700 leading-relaxed">
          実店舗で入手しやすく、Amazon・楽天・メルカリで需要が高い商品カテゴリ。店内で見かけたら
          「店舗スキャン」で利益を確認してください。
        </p>
      </div>

      {/* 店舗フィルター */}
      <div className="overflow-x-auto scrollbar-hide -mx-4 px-4">
        <div className="flex gap-1.5 pb-2">
          <FilterChip active={filter === 'all'} onClick={() => setFilter('all')}>
            すべて
          </FilterChip>
          {ALL_STORE_KEYS.map((s) => (
            <FilterChip key={s} active={filter === s} onClick={() => setFilter(s)}>
              {STORE_LABELS[s]}
            </FilterChip>
          ))}
        </div>
      </div>

      {deals.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-200 py-10 text-center">
          <Store className="h-6 w-6 text-gray-200 mx-auto mb-2" />
          <p className="text-xs text-gray-400">該当する商品が見つかりません</p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {deals.map((d) => <StoreDealCard key={d.id} deal={d} />)}
        </div>
      )}
    </div>
  )
}

function FilterChip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={clsx(
        'rounded-full px-3 py-1.5 text-[11px] font-bold whitespace-nowrap transition-colors flex-shrink-0',
        active ? 'bg-indigo-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
      )}
    >
      {children}
    </button>
  )
}

function StoreDealCard({ deal }: { deal: StoreDeal }) {
  const d = deal
  const diff = DIFFICULTY_LABELS[d.difficulty]
  const [showLinks, setShowLinks] = useState(false)
  const candidates = buildSellCandidatesFromQuery(d.name, d.bestSellPlatform)

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-bold text-gray-900 leading-snug">{d.name}</p>
          <p className="text-[10px] text-gray-400 mt-0.5">{d.category}</p>
        </div>
        <span className={clsx('flex-shrink-0 rounded-full px-2 py-0.5 text-[9px] font-bold', diff.color)}>
          {diff.label}
        </span>
      </div>

      {/* 店舗タグ */}
      <div className="flex flex-wrap gap-1 mb-2.5">
        {d.stores.map((s) => (
          <span
            key={s}
            className={clsx('rounded-full border px-2 py-0.5 text-[10px] font-bold', STORE_COLORS[s])}
          >
            {STORE_LABELS[s]}
          </span>
        ))}
      </div>

      {/* 価格帯 */}
      <div className="grid grid-cols-3 gap-1.5 rounded-xl bg-gray-50 p-2.5 mb-2.5">
        <div className="text-center">
          <p className="text-[9px] text-gray-400 mb-0.5">店頭想定</p>
          <p className="text-[11px] font-bold text-gray-800">
            ¥{d.inStorePriceRange[0].toLocaleString()}〜
          </p>
          <p className="text-[10px] text-gray-500">¥{d.inStorePriceRange[1].toLocaleString()}</p>
        </div>
        <div className="text-center border-l border-r border-gray-200">
          <p className="text-[9px] text-gray-400 mb-0.5">販売想定</p>
          <p className="text-[11px] font-bold text-gray-800">
            ¥{d.sellPriceRange[0].toLocaleString()}〜
          </p>
          <p className="text-[10px] text-gray-500">¥{d.sellPriceRange[1].toLocaleString()}</p>
        </div>
        <div className="text-center">
          <p className="text-[9px] text-gray-400 mb-0.5">平均利益</p>
          <p className="text-[13px] font-bold text-emerald-600">
            +{formatCurrency(d.estimatedProfit)}
          </p>
          <p className="text-[9px] text-gray-400">{PLATFORM_SHORT[d.bestSellPlatform]}で販売</p>
        </div>
      </div>

      {/* ヒント */}
      <div className="rounded-lg bg-indigo-50/60 border border-indigo-100 p-2.5 mb-2.5">
        <div className="flex items-start gap-1.5">
          <MapPin className="h-3 w-3 text-indigo-500 flex-shrink-0 mt-0.5" />
          <p className="text-[10px] text-indigo-800 leading-relaxed">{d.hint}</p>
        </div>
      </div>

      {/* キーワード */}
      <div className="flex flex-wrap gap-1 mb-2.5">
        {d.keywords.slice(0, 5).map((k) => (
          <span key={k} className="rounded-full bg-gray-100 px-2 py-0.5 text-[9px] text-gray-600">
            #{k}
          </span>
        ))}
      </div>

      <button
        type="button"
        onClick={() => setShowLinks(true)}
        className="w-full flex items-center justify-center gap-1 rounded-lg border border-indigo-200 bg-indigo-50 py-2 text-[11px] font-bold text-indigo-700 hover:bg-indigo-100 transition-colors"
      >
        <ExternalLink className="h-3 w-3" />
        {PLATFORM_LABELS[d.bestSellPlatform]}で実売相場を見る
      </button>

      {showLinks && (
        <LinkChoiceModal
          title={`${PLATFORM_LABELS[d.bestSellPlatform]}で実売相場を確認`}
          subtitle={d.name}
          candidates={candidates}
          onClose={() => setShowLinks(false)}
        />
      )}
    </div>
  )
}
