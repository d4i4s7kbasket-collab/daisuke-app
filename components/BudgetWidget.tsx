'use client'

import { useState } from 'react'
import clsx from 'clsx'
import { Wallet, AlertTriangle, Plus, X, Minus, History } from 'lucide-react'
import type { InventoryItem } from '@/lib/types'
import type { BudgetAdjustment } from '@/lib/settings'
import { monthlySpent, budgetStatus, effectiveBudget, monthlyAdjustments } from '@/lib/budget'
import { formatCurrency } from '@/lib/calculations'

interface Props {
  monthlyBudget: number
  inventory: InventoryItem[]
  compact?: boolean
  adjustments?: BudgetAdjustment[]
  /** 予算を手動で追加／削減したときのコールバック（新しいAdjustmentを追記） */
  onAddAdjustment?: (a: BudgetAdjustment) => void
  /** 個別の調整を取り消すコールバック */
  onRemoveAdjustment?: (id: string) => void
}

export default function BudgetWidget({
  monthlyBudget, inventory, compact, adjustments, onAddAdjustment, onRemoveAdjustment,
}: Props) {
  const [editing, setEditing] = useState(false)
  const [showHistory, setShowHistory] = useState(false)

  const spent = monthlySpent(inventory)
  const adjTotal = monthlyAdjustments(adjustments)
  const totalBudget = effectiveBudget(monthlyBudget, adjustments)
  const status = budgetStatus(totalBudget, spent)

  const barColor =
    status.level === 'over' ? 'bg-red-500'
    : status.level === 'warn' ? 'bg-amber-500'
    : 'bg-indigo-500'

  const labelColor =
    status.level === 'over' ? 'text-red-600'
    : status.level === 'warn' ? 'text-amber-700'
    : 'text-indigo-700'

  // 今月の調整のみ抽出（UI表示用）
  const now = new Date()
  const thisMonthAdj = (adjustments ?? []).filter((a) => {
    const d = new Date(a.at)
    return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth()
  })

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
        <span className="text-[11px] text-gray-400">/ {formatCurrency(totalBudget)}</span>
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

      {/* 予算の内訳（基礎 + 調整） */}
      {adjTotal !== 0 && (
        <div className="mt-2 flex items-center justify-between rounded-lg bg-indigo-50/60 border border-indigo-100 px-2.5 py-1.5 text-[10px]">
          <span className="text-indigo-500">基礎予算 {formatCurrency(monthlyBudget)}</span>
          <span className={clsx('font-bold', adjTotal > 0 ? 'text-emerald-600' : 'text-rose-600')}>
            {adjTotal > 0 ? '+' : ''}{formatCurrency(adjTotal)} 調整
          </span>
        </div>
      )}

      {/* 手動追加ボタン */}
      {onAddAdjustment && !editing && (
        <div className="mt-3 flex gap-1.5">
          <button
            onClick={() => setEditing(true)}
            className="flex-1 rounded-xl border border-indigo-200 bg-indigo-50 text-indigo-700 text-[11px] font-bold py-2 flex items-center justify-center gap-1 hover:bg-indigo-100 transition-colors"
          >
            <Plus className="h-3 w-3" />
            予算を追加・調整
          </button>
          {thisMonthAdj.length > 0 && (
            <button
              onClick={() => setShowHistory(!showHistory)}
              className="rounded-xl border border-gray-200 bg-white text-gray-500 text-[11px] font-bold px-3 py-2 flex items-center gap-1 hover:bg-gray-50 transition-colors"
              aria-label="調整履歴"
            >
              <History className="h-3 w-3" />
              {thisMonthAdj.length}
            </button>
          )}
        </div>
      )}

      {editing && onAddAdjustment && (
        <BudgetAdjustmentForm
          onSubmit={(amount, note) => {
            onAddAdjustment({
              id: `adj-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
              amount,
              note,
              at: new Date().toISOString(),
            })
            setEditing(false)
          }}
          onCancel={() => setEditing(false)}
        />
      )}

      {showHistory && thisMonthAdj.length > 0 && (
        <div className="mt-2 space-y-1">
          {thisMonthAdj.slice().reverse().map((a) => (
            <div key={a.id} className="flex items-center justify-between rounded-lg border border-gray-100 bg-gray-50 px-2.5 py-1.5">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <span className={clsx('text-[11px] font-bold tabular-nums', a.amount >= 0 ? 'text-emerald-600' : 'text-rose-600')}>
                    {a.amount >= 0 ? '+' : ''}{formatCurrency(a.amount)}
                  </span>
                  <span className="text-[9px] text-gray-400">
                    {new Date(a.at).toLocaleDateString('ja-JP', { month: 'numeric', day: 'numeric' })}
                  </span>
                </div>
                {a.note && <p className="text-[10px] text-gray-500 truncate">{a.note}</p>}
              </div>
              {onRemoveAdjustment && (
                <button
                  onClick={() => onRemoveAdjustment(a.id)}
                  className="rounded-full p-1 text-gray-300 hover:bg-white hover:text-red-500 transition-colors flex-shrink-0"
                  aria-label="この調整を取り消す"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function BudgetAdjustmentForm({
  onSubmit, onCancel,
}: {
  onSubmit: (amount: number, note: string | undefined) => void
  onCancel: () => void
}) {
  const [sign, setSign] = useState<'add' | 'sub'>('add')
  const [amountStr, setAmountStr] = useState('')
  const [note, setNote] = useState('')

  const amountAbs = Number(amountStr.replace(/[^\d]/g, '')) || 0
  const valid = amountAbs > 0

  return (
    <div className="mt-3 rounded-2xl border-2 border-indigo-200 bg-indigo-50/50 p-3 space-y-2.5">
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          onClick={() => setSign('add')}
          className={clsx(
            'flex-1 flex items-center justify-center gap-1 rounded-lg py-1.5 text-[11px] font-bold transition-colors',
            sign === 'add'
              ? 'bg-emerald-500 text-white'
              : 'bg-white border border-gray-200 text-gray-500'
          )}
        >
          <Plus className="h-3 w-3" />追加
        </button>
        <button
          type="button"
          onClick={() => setSign('sub')}
          className={clsx(
            'flex-1 flex items-center justify-center gap-1 rounded-lg py-1.5 text-[11px] font-bold transition-colors',
            sign === 'sub'
              ? 'bg-rose-500 text-white'
              : 'bg-white border border-gray-200 text-gray-500'
          )}
        >
          <Minus className="h-3 w-3" />削減
        </button>
      </div>

      <div>
        <label className="text-[10px] font-bold text-gray-500 block mb-1">金額（円）</label>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-400">¥</span>
          <input
            type="number"
            inputMode="numeric"
            min={0}
            step={1000}
            autoFocus
            value={amountStr}
            onChange={(e) => setAmountStr(e.target.value)}
            placeholder="例: 30000"
            className="flex-1 rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
          />
        </div>
        <div className="mt-1.5 flex flex-wrap gap-1">
          {[10000, 30000, 50000, 100000].map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => setAmountStr(String(v))}
              className="rounded-full bg-white border border-gray-200 text-gray-600 text-[10px] font-bold px-2 py-0.5 hover:bg-gray-50"
            >
              {sign === 'add' ? '+' : '-'}{formatCurrency(v)}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="text-[10px] font-bold text-gray-500 block mb-1">メモ（任意）</label>
        <input
          type="text"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="例: ボーナス振込、臨時出費 など"
          className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
        />
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 rounded-xl border border-gray-200 bg-white text-gray-500 text-xs font-bold py-2 hover:bg-gray-50"
        >
          キャンセル
        </button>
        <button
          type="button"
          disabled={!valid}
          onClick={() => onSubmit(sign === 'add' ? amountAbs : -amountAbs, note.trim() || undefined)}
          className={clsx(
            'flex-1 rounded-xl text-white text-xs font-bold py-2 transition-colors',
            !valid
              ? 'bg-gray-200 cursor-not-allowed'
              : sign === 'add'
                ? 'bg-emerald-600 hover:bg-emerald-700'
                : 'bg-rose-600 hover:bg-rose-700'
          )}
        >
          {sign === 'add' ? '予算を追加' : '予算を削減'}
        </button>
      </div>
    </div>
  )
}
