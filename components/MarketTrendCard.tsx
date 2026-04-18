'use client'

import clsx from 'clsx'
import type { MarketTrend } from '@/lib/types'
import { getTrendColorClass, getTrendIcon } from '@/lib/calculations'

const COMPETITION_LABEL: Record<string, string> = {
  high: '競合多',
  medium: '普通',
  low: '競合少',
}

const COMPETITION_COLOR: Record<string, string> = {
  high: 'bg-red-100 text-red-600',
  medium: 'bg-amber-100 text-amber-600',
  low: 'bg-emerald-100 text-emerald-600',
}

interface MarketTrendCardProps {
  trend: MarketTrend
}

export default function MarketTrendCard({ trend }: MarketTrendCardProps) {
  return (
    <div className="rounded-2xl border bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h4 className="text-sm font-bold text-gray-900">{trend.category}</h4>
          <div className="mt-1 flex items-center gap-2">
            <span className={clsx('text-base font-bold', getTrendColorClass(trend.trend))}>
              {getTrendIcon(trend.trend)}
            </span>
            <span className="text-xs text-gray-500">
              平均利益率{' '}
              <span className="font-semibold text-emerald-600">{trend.avgProfitRate.toFixed(1)}%</span>
            </span>
          </div>
        </div>
        <span className={clsx('rounded-full px-2 py-0.5 text-[10px] font-medium', COMPETITION_COLOR[trend.competitionLevel])}>
          {COMPETITION_LABEL[trend.competitionLevel]}
        </span>
      </div>

      <p className="mt-2 text-xs text-gray-500 leading-relaxed">{trend.insight}</p>

      <div className="mt-3 flex flex-wrap gap-1">
        {trend.recommendedBrands.map((brand) => (
          <span key={brand} className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] text-gray-600">
            {brand}
          </span>
        ))}
      </div>
    </div>
  )
}
