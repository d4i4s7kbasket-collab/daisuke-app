'use client'

import { X, ExternalLink, Zap, Search, TrendingDown, Clock, CheckCircle2, Filter } from 'lucide-react'
import clsx from 'clsx'
import type { UrlCandidate, CandidateKind } from '@/lib/buyCandidates'
import { PLATFORM_LABELS } from '@/lib/calculations'

interface Props {
  title: string
  subtitle?: string
  candidates: UrlCandidate[]
  onClose: () => void
}

const PLATFORM_BADGE: Record<string, string> = {
  amazon: 'bg-orange-100 text-orange-700 border-orange-200',
  rakuten: 'bg-red-100 text-red-700 border-red-200',
  mercari: 'bg-pink-100 text-pink-700 border-pink-200',
  yahoo: 'bg-purple-100 text-purple-700 border-purple-200',
  paypay: 'bg-red-50 text-red-500 border-red-100',
}

const KIND_META: Record<CandidateKind, { icon: typeof Zap; label: string; color: string }> = {
  direct:   { icon: CheckCircle2, label: '直リンク',    color: 'text-emerald-600 bg-emerald-50 border-emerald-200' },
  sold:     { icon: TrendingDown, label: '実売・売切', color: 'text-rose-600 bg-rose-50 border-rose-200' },
  cheapest: { icon: TrendingDown, label: '安い順',      color: 'text-blue-600 bg-blue-50 border-blue-200' },
  newest:   { icon: Clock,        label: '新着',        color: 'text-sky-600 bg-sky-50 border-sky-200' },
  refined:  { icon: Filter,       label: '絞り込み',    color: 'text-indigo-600 bg-indigo-50 border-indigo-200' },
  search:   { icon: Search,       label: '通常検索',    color: 'text-gray-600 bg-gray-50 border-gray-200' },
}

export default function LinkChoiceModal({ title, subtitle, candidates, onClose }: Props) {
  const hasDirect = candidates.some((c) => c.kind === 'direct')

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-t-3xl sm:rounded-3xl bg-white shadow-2xl max-h-[85vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 引き手 */}
        <div className="flex justify-center pt-3 pb-1 sm:hidden">
          <div className="h-1 w-10 rounded-full bg-gray-200" />
        </div>

        {/* ヘッダー */}
        <div className="flex items-start justify-between gap-3 px-5 pt-4 pb-3 border-b">
          <div className="min-w-0">
            <h2 className="text-sm font-bold text-gray-900 leading-snug">{title}</h2>
            {subtitle && (
              <p className="text-[11px] text-gray-500 mt-0.5 line-clamp-2">{subtitle}</p>
            )}
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-1.5 hover:bg-gray-100 transition-colors flex-shrink-0"
            aria-label="閉じる"
          >
            <X className="h-4 w-4 text-gray-400" />
          </button>
        </div>

        {/* 候補リスト */}
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
          {hasDirect && (
            <p className="text-[10px] font-semibold text-emerald-600 mb-1 flex items-center gap-1">
              <Zap className="h-2.5 w-2.5" />
              参考になった商品に直接飛べます
            </p>
          )}

          {candidates.length === 0 && (
            <div className="rounded-xl border border-dashed border-gray-200 py-8 text-center">
              <p className="text-xs text-gray-400">候補が見つかりません</p>
            </div>
          )}

          {candidates.map((c, i) => {
            const meta = KIND_META[c.kind]
            const Icon = meta.icon
            return (
              <a
                key={i}
                href={c.url}
                target="_blank"
                rel="noopener noreferrer"
                onClick={onClose}
                className={clsx(
                  'block rounded-2xl border bg-white p-3 transition-all active:scale-[0.98]',
                  c.kind === 'direct'
                    ? 'border-emerald-300 bg-emerald-50/40 hover:bg-emerald-50/80'
                    : 'border-gray-200 hover:border-indigo-300 hover:bg-indigo-50/30'
                )}
              >
                <div className="flex items-center justify-between gap-2 mb-1">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className={clsx('flex-shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-bold', PLATFORM_BADGE[c.platform] ?? 'bg-gray-100')}>
                      {PLATFORM_LABELS[c.platform]}
                    </span>
                    <span className={clsx('flex-shrink-0 inline-flex items-center gap-1 rounded-full border px-1.5 py-0.5 text-[9px] font-bold', meta.color)}>
                      <Icon className="h-2.5 w-2.5" />{meta.label}
                    </span>
                  </div>
                  <ExternalLink className="h-3 w-3 text-gray-300 flex-shrink-0" />
                </div>

                <p className="text-xs font-bold text-gray-900 leading-snug">{c.label}</p>
                {c.note && (
                  <p className="text-[10px] text-gray-500 mt-0.5 leading-relaxed">{c.note}</p>
                )}
              </a>
            )
          })}
        </div>

        {/* フッター */}
        <div className="border-t px-5 py-3">
          <p className="text-[10px] text-gray-400 leading-relaxed">
            候補をタップすると新しいタブで開きます。表記ゆれがある場合は複数候補を比較してみてください。
          </p>
        </div>
      </div>
    </div>
  )
}
