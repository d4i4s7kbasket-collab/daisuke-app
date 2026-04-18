'use client'

import { useState } from 'react'
import clsx from 'clsx'
import { Package, Tag, CheckCircle2, Trash2, FileText, PackageCheck, Minus, Plus, Undo2 } from 'lucide-react'
import type { InventoryItem, InventoryStatus } from '@/lib/types'
import { formatCurrency, PLATFORM_SHORT } from '@/lib/calculations'
import ProductImage from './ProductImage'

const STATUS_META: Record<InventoryStatus, { label: string; color: string }> = {
  in_stock:  { label: '在庫',   color: 'bg-slate-100 text-slate-700' },
  listed:    { label: '出品中', color: 'bg-indigo-100 text-indigo-700' },
  sold:      { label: '販売済', color: 'bg-emerald-100 text-emerald-700' },
  returned:  { label: '返品',   color: 'bg-red-100 text-red-600' },
}

interface Props {
  items: InventoryItem[]
  onUpdate: (id: string, patch: Partial<InventoryItem>) => void
  onRemove: (id: string) => void
  onShowTemplate: (item: InventoryItem) => void
}

export default function InventoryTable({ items, onUpdate, onRemove, onShowTemplate }: Props) {
  const [expanded, setExpanded] = useState<string | null>(null)

  if (items.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-gray-200 py-12 text-center">
        <Package className="h-8 w-8 text-gray-200 mx-auto mb-2" />
        <p className="text-sm text-gray-400">在庫はまだありません</p>
        <p className="text-xs text-gray-300 mt-1">承認すると自動で在庫に追加されます</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {items.map((it) => {
        const isOpen = expanded === it.id
        const meta = STATUS_META[it.status]
        const totalCost = (it.product.cost.buyPrice + it.product.cost.purchaseShipping) * it.quantity
        const expectedProfit = it.product.cost.profit * it.remaining

        return (
          <div key={it.id} className="rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden">
            <button
              onClick={() => setExpanded(isOpen ? null : it.id)}
              className="w-full p-4 flex items-start gap-3 text-left hover:bg-gray-50 transition-colors"
            >
              <div className="h-14 w-14 flex-shrink-0 overflow-hidden rounded-xl bg-gray-50 border border-gray-100">
                <ProductImage src={it.product.imageUrl} alt={it.product.name} category={it.product.category} name={it.product.name} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 mb-1">
                  <span className={clsx('rounded-full px-2 py-0.5 text-[10px] font-bold', meta.color)}>
                    {meta.label}
                  </span>
                  <span className="text-[10px] text-gray-400">
                    → {PLATFORM_SHORT[it.product.sellPlatform]}
                  </span>
                </div>
                <p className="text-xs font-bold text-gray-900 line-clamp-2 leading-snug">{it.product.name}</p>
                <div className="mt-1.5 flex items-center gap-3 text-[11px]">
                  <span className="text-gray-500">残 <b className="text-gray-800">{it.remaining}</b>/{it.quantity}個</span>
                  <span className="text-emerald-600 font-semibold">
                    +{formatCurrency(expectedProfit)}
                  </span>
                </div>
              </div>
            </button>

            {isOpen && (
              <div className="border-t border-gray-100 bg-gray-50 p-4 space-y-3">
                <div className="grid grid-cols-3 gap-2 text-center">
                  <Stat label="投資額" value={formatCurrency(totalCost)} />
                  <Stat label="販売価格" value={formatCurrency(it.listedPrice ?? it.product.cost.sellPrice)} />
                  <Stat label="利益率" value={`${it.product.cost.profitRate.toFixed(1)}%`} accent />
                </div>

                {/* ステータス変更 */}
                <div className="flex flex-wrap gap-1.5">
                  {(Object.keys(STATUS_META) as InventoryStatus[]).map((s) => (
                    <button
                      key={s}
                      onClick={() => onUpdate(it.id, { status: s })}
                      className={clsx(
                        'rounded-full px-3 py-1 text-[10px] font-bold transition-colors',
                        it.status === s
                          ? STATUS_META[s].color + ' ring-2 ring-offset-1 ring-indigo-300'
                          : 'bg-white text-gray-500 border border-gray-200 hover:bg-gray-50'
                      )}
                    >
                      {STATUS_META[s].label}
                    </button>
                  ))}
                </div>

                {/* 販売数調整 */}
                <div className="rounded-xl bg-white border border-gray-100 p-2.5 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold text-gray-500">残数</span>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => {
                          const next = Math.max(0, it.remaining - 1)
                          // 0 になったら自動で販売済
                          onUpdate(it.id, {
                            remaining: next,
                            status: next === 0 ? 'sold' : (it.status === 'sold' ? 'in_stock' : it.status),
                          })
                        }}
                        disabled={it.remaining <= 0}
                        aria-label="残数を1減らす"
                        className={clsx(
                          'h-7 w-7 rounded-full flex items-center justify-center border transition-colors',
                          it.remaining <= 0
                            ? 'border-gray-100 text-gray-200 cursor-not-allowed'
                            : 'border-gray-200 text-gray-600 hover:bg-gray-50 active:scale-95'
                        )}
                      >
                        <Minus className="h-3 w-3" />
                      </button>
                      <span className="text-sm font-bold text-gray-900 tabular-nums min-w-[3ch] text-center">
                        {it.remaining}
                        <span className="text-[10px] text-gray-400 font-normal"> / {it.quantity}</span>
                      </span>
                      <button
                        onClick={() => {
                          const next = Math.min(it.quantity, it.remaining + 1)
                          onUpdate(it.id, {
                            remaining: next,
                            // 残数が1以上になったら 'sold' から自動で 'in_stock' に戻す
                            status: it.status === 'sold' && next > 0 ? 'in_stock' : it.status,
                          })
                        }}
                        disabled={it.remaining >= it.quantity}
                        aria-label="残数を1増やす"
                        className={clsx(
                          'h-7 w-7 rounded-full flex items-center justify-center border transition-colors',
                          it.remaining >= it.quantity
                            ? 'border-gray-100 text-gray-200 cursor-not-allowed'
                            : 'border-gray-200 text-gray-600 hover:bg-gray-50 active:scale-95'
                        )}
                      >
                        <Plus className="h-3 w-3" />
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {it.status !== 'sold' && it.remaining > 0 && (
                      <button
                        onClick={() => {
                          const next = Math.max(0, it.remaining - 1)
                          onUpdate(it.id, { remaining: next, status: next === 0 ? 'sold' : it.status })
                        }}
                        className="flex-1 rounded-xl bg-emerald-600 text-white text-xs font-bold py-2 flex items-center justify-center gap-1 hover:bg-emerald-700 transition-colors"
                      >
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        1個販売として記録
                      </button>
                    )}

                    {/* 販売済 → 取り消して在庫に戻す */}
                    {(it.status === 'sold' || it.remaining < it.quantity) && (
                      <button
                        onClick={() => {
                          const next = Math.min(it.quantity, it.remaining + 1)
                          onUpdate(it.id, {
                            remaining: next,
                            status: next > 0 && it.status === 'sold' ? 'in_stock' : it.status,
                          })
                        }}
                        disabled={it.remaining >= it.quantity}
                        className={clsx(
                          'flex-1 rounded-xl border text-xs font-bold py-2 flex items-center justify-center gap-1 transition-colors',
                          it.remaining >= it.quantity
                            ? 'border-gray-100 text-gray-300 cursor-not-allowed'
                            : 'border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100'
                        )}
                      >
                        <Undo2 className="h-3.5 w-3.5" />
                        販売を1個取り消す
                      </button>
                    )}
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => onShowTemplate(it)}
                    className="flex-1 rounded-xl border border-indigo-200 bg-indigo-50 text-indigo-700 text-xs font-bold py-2 flex items-center justify-center gap-1 hover:bg-indigo-100 transition-colors"
                  >
                    <FileText className="h-3.5 w-3.5" />
                    出品テンプレート
                  </button>
                  <button
                    onClick={() => { if (confirm('この在庫を削除しますか？')) onRemove(it.id) }}
                    className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-gray-400 hover:bg-gray-50 hover:text-red-500 transition-colors"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>

                {it.memo && (
                  <div className="rounded-lg bg-white border border-gray-100 px-3 py-2 text-[11px] text-gray-500">
                    <Tag className="inline h-3 w-3 mr-1 text-gray-300" />
                    {it.memo}
                  </div>
                )}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

function Stat({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="rounded-lg bg-white border border-gray-100 py-2">
      <p className="text-[9px] text-gray-400">{label}</p>
      <p className={clsx('text-xs font-bold', accent ? 'text-emerald-600' : 'text-gray-800')}>{value}</p>
    </div>
  )
}

export function InventorySummary({ items }: { items: InventoryItem[] }) {
  const totalUnits = items.reduce((s, i) => s + i.remaining, 0)
  const totalCost = items.reduce((s, i) => s + (i.product.cost.buyPrice + i.product.cost.purchaseShipping) * i.remaining, 0)
  const expectedProfit = items.reduce((s, i) => s + i.product.cost.profit * i.remaining, 0)

  return (
    <div className="grid grid-cols-3 gap-2">
      <SummaryCard icon={<Package className="h-3.5 w-3.5" />} label="在庫数" value={`${totalUnits}個`} />
      <SummaryCard icon={<PackageCheck className="h-3.5 w-3.5" />} label="投資額" value={formatCurrency(totalCost)} />
      <SummaryCard icon={<CheckCircle2 className="h-3.5 w-3.5" />} label="想定利益" value={formatCurrency(expectedProfit)} accent />
    </div>
  )
}

function SummaryCard({ icon, label, value, accent }: { icon: React.ReactNode; label: string; value: string; accent?: boolean }) {
  return (
    <div className={clsx('rounded-xl border p-3', accent ? 'border-emerald-200 bg-emerald-50' : 'border-gray-100 bg-white')}>
      <div className={clsx('flex items-center gap-1 text-[10px] mb-1', accent ? 'text-emerald-600' : 'text-gray-400')}>
        {icon}{label}
      </div>
      <p className={clsx('text-sm font-bold', accent ? 'text-emerald-700' : 'text-gray-800')}>{value}</p>
    </div>
  )
}
