'use client'

import clsx from 'clsx'
import { Wallet, AlertTriangle } from 'lucide-react'
import type { InventoryItem } from '@/lib/types'
import { monthlySpent, budgetStatus } from '@/lib/budget'
import { formatCurrency } from '@/lib/calculations'

interface Props {
  monthlyBudget: number
  inventory: InventoryItem[]
  compact?: boolean
}

export default function BudgetWidget({ monthlyBudget, inventory, compact }: Props) {
  const spent = monthlySpent(inventory)
  const status = budgetStatus(monthlyBudget, spent)

  const barColor =
    status.level === 'over' ? 'bg-red-500'
    : status.level === 'warn' ? 'bg-amber-500'
    : 'bg-indigo-500'

  const labelColor =
    status.level === 'over' ? 'text-red-600'
    : status.level === 'warn' ? 'text-amber-700'
    : 'text-indigo-700'

  if (compact) {
    return (
      <div className="flex items-center gap-2 rounded-xl border border-gray-100 bg-white px-3 py-2">
        <Wallet className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 mb-0.5">
            <span className="text-[10px] text-gray-400">今月の予算残高</span>
            <span className={clsx('text-[11px] font-bold', labelColor)}>
              {formatCurrency(Math.max(0, status.remaining))}
            </span>
          </div>
          <div className="h-1 rounded-full bg-gray-100 overflow-hidden">
            <div
              className={clsx('h-full rounded-full transition-all', barColor)}
              style={{ width: `${Math.min(status.usedRate, 100)}%` }}
            />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-1.5">
          <Wallet className="h-3.5 w-3.5 text-indigo-500" />
          <h3 className="text-xs font-bold text-gray-700">今月の仕入れ予算</h3>
        </div>
        {status.level === 'over' && (
          <span className="flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-bold text-red-600">
            <AlertTriangle className="h-2.5 w-2.5" />予算超過
          </span>
        )}
        {status.level === 'warn' && (
          <span className="flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-700">
            <AlertTriangle className="h-2.5 w-2.5" />残りわずか
          </span>
        )}
      </div>

      <div className="flex items-baseline gap-1 mb-1">
        <span className={clsx('text-2xl font-bold', labelColor)}>
          {formatCurrency(Math.max(0, status.remaining))}
        </span>
        <span className="text-[11px] text-gray-400">/ {formatCurrency(monthlyBudget)}</span>
      </div>

      <div className="h-1.5 rounded-full bg-gray-100 overflow-hidden mb-2">
        <div
          className={clsx('h-full rounded-full transition-all', barColor)}
          style={{ width: `${Math.min(status.usedRate, 100)}%` }}
        />
      </div>

      <div className="flex items-center justify-between text-[11px]">
        <span className="text-gray-500">使用済 <b className="text-gray-700">{formatCurrency(spent)}</b></span>
        <span className="text-gray-400">{status.usedRate.toFixed(0)}% 使用</span>
      </div>
    </div>
  )
}
