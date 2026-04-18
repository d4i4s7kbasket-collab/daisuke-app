'use client'

import { type ReactNode } from 'react'
import clsx from 'clsx'

interface StatCardProps {
  title: string
  value: string
  sub?: string
  icon: ReactNode
  trend?: number
  color?: 'default' | 'profit' | 'loss' | 'warning'
}

export default function StatCard({ title, value, sub, icon, trend, color = 'default' }: StatCardProps) {
  const colorMap = {
    default: 'bg-white border-gray-200',
    profit: 'bg-emerald-50 border-emerald-200',
    loss: 'bg-red-50 border-red-200',
    warning: 'bg-amber-50 border-amber-200',
  }

  return (
    <div className={clsx('rounded-2xl border p-4 shadow-sm', colorMap[color])}>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-medium text-gray-500 tracking-wide truncate">{title}</p>
          <p className="mt-1 text-xl font-bold text-gray-900 leading-tight break-all">{value}</p>
          {sub && <p className="mt-0.5 text-[10px] text-gray-400">{sub}</p>}
        </div>
        <div className="flex-shrink-0 rounded-xl bg-indigo-50 p-2 text-indigo-500">{icon}</div>
      </div>
      {trend !== undefined && (
        <div className="mt-2.5 flex items-center gap-1">
          <span className={clsx('text-[11px] font-semibold', trend >= 0 ? 'text-emerald-600' : 'text-red-500')}>
            {trend >= 0 ? '▲' : '▼'} {Math.abs(trend).toFixed(1)}%
          </span>
          <span className="text-[11px] text-gray-400">先月比</span>
        </div>
      )}
    </div>
  )
}
