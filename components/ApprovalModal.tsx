'use client'

import { useState } from 'react'
import { X, CheckCircle2, ExternalLink, Star, ArrowRight, ShoppingCart, Search, AlertTriangle, Info, ChevronRight, MapPin, ShieldAlert } from 'lucide-react'
import clsx from 'clsx'
import type { Recommendation } from '@/lib/types'
import { formatCurrency, getProfitColorClass, PLATFORM_SHORT, PLATFORM_LABELS, DIFFICULTY_LABEL, DIFFICULTY_BADGE, DIFFICULTY_DESC } from '@/lib/calculations'
import { amazonCartUrl, buyUrl } from '@/lib/deepLinks'
import { buildBuyCandidates, buildSellCandidates } from '@/lib/buyCandidates'
import ProductImage from './ProductImage'
import LinkChoiceModal from './LinkChoiceModal'

const BADGE: Record<string, string> = {
  amazon: 'bg-orange-100 text-orange-700 border-orange-200',
  rakuten: 'bg-red-100 text-red-700 border-red-200',
  mercari: 'bg-pink-100 text-pink-700 border-pink-200',
  yahoo: 'bg-purple-100 text-purple-700 border-purple-200',
}

interface Props {
  rec: Recommendation
  onApprove: (id: string) => void
  onReject: (id: string) => void
  onClose: () => void
  budgetRemaining?: number
}

export default function ApprovalModal({ rec, onApprove, onReject, onClose, budgetRemaining }: Props) {
  const [loading, setLoading] = useState<'approve' | 'reject' | null>(null)
  const [linkMode, setLinkMode] = useState<null | 'buy' | 'sell'>(null)
  const { product: p } = rec
  const { cost } = p

  const handle = async (action: 'approve' | 'reject') => {
    setLoading(action)
    await new Promise((r) => setTimeout(r, 600))
    if (action === 'approve') onApprove(rec.id)
    else onReject(rec.id)
  }

  const totalInvestment = (cost.buyPrice + cost.purchaseShipping) * rec.buyQuantity
  const monthlyProfit = cost.profit * rec.estimatedMonthlySales
  const overBudget =
    typeof budgetRemaining === 'number' && totalInvestment > budgetRemaining

  const amazonCart = p.sourcePlatform === 'amazon' ? amazonCartUrl(p) : null
  const buyLink = buyUrl(p)
  const buyCandidates = buildBuyCandidates(p)
  const sellCandidates = buildSellCandidates(p)

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-t-3xl sm:rounded-3xl bg-white shadow-2xl max-h-[92vh] overflow-y-auto">
        <div className="flex justify-center pt-3 pb-1 sm:hidden">
          <div className="h-1 w-10 rounded-full bg-gray-200" />
        </div>

        <div className="flex items-center justify-between px-5 py-4 border-b">
          <h2 className="text-sm font-bold text-gray-900">仕入れ確認</h2>
          <button onClick={onClose} className="rounded-full p-1.5 hover:bg-gray-100 transition-colors">
            <X className="h-4 w-4 text-gray-400" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* 商品情報 */}
          <div className="flex gap-3">
            <div className="h-20 w-20 flex-shrink-0 overflow-hidden rounded-xl bg-gray-50 border border-gray-100">
              <ProductImage src={p.imageUrl} alt={p.name} category={p.category} name={p.name} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-gray-900 leading-snug">{p.name}</p>
              <div className="mt-1 flex items-center gap-0.5">
                <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                <span className="text-xs text-gray-500">{p.rating} ({p.reviewCount.toLocaleString()}件)</span>
              </div>
              <a
                href={buyLink}
                target="_blank"
                rel="noopener noreferrer"
                className={clsx(
                  'mt-1.5 inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[10px] font-bold',
                  BADGE[p.sourcePlatform] ?? 'bg-gray-100 text-gray-600 border-gray-200'
                )}
              >
                {PLATFORM_LABELS[p.sourcePlatform]}で商品確認
                <ExternalLink className="h-2.5 w-2.5" />
              </a>
            </div>
          </div>

          {/* フロー */}
          <div className="flex items-center gap-2 rounded-xl bg-gray-50 p-3">
            <div className="flex-1 text-center">
              <p className="text-[10px] text-gray-400 mb-0.5">仕入れ先</p>
              <p className="text-xs font-bold text-gray-800">{PLATFORM_SHORT[p.sourcePlatform]}</p>
            </div>
            <ArrowRight className="h-4 w-4 text-gray-300 flex-shrink-0" />
            <div className="flex-1 text-center">
              <p className="text-[10px] text-gray-400 mb-0.5">販売先</p>
              <p className="text-xs font-bold text-gray-800">{PLATFORM_SHORT[p.sellPlatform]}</p>
            </div>
            <ArrowRight className="h-4 w-4 text-gray-300 flex-shrink-0" />
            <div className="flex-1 text-center">
              <p className="text-[10px] text-gray-400 mb-0.5">数量</p>
              <p className="text-xs font-bold text-gray-800">{rec.buyQuantity}個</p>
            </div>
          </div>

          {/* コスト内訳（1個） */}
          <div>
            <p className="text-[11px] font-semibold text-gray-500 mb-2">
              1個あたりのコスト内訳
              {p.priceBand && <span className="text-gray-400 font-normal">（中央値ベース）</span>}
            </p>
            <div className="rounded-xl border border-gray-100 overflow-hidden divide-y divide-gray-50">
              <CostRow
                label="仕入れ価格"
                value={
                  p.priceBand
                    ? `${formatCurrency(p.priceBand.buyMin)}〜${formatCurrency(p.priceBand.buyMax)}`
                    : formatCurrency(cost.buyPrice)
                }
              />
              {cost.purchaseShipping > 0 && (
                <CostRow label="仕入れ送料" value={formatCurrency(cost.purchaseShipping)} />
              )}
              <CostRow label={`販売手数料（${PLATFORM_SHORT[p.sellPlatform]}）`} value={formatCurrency(cost.platformFee)} />
              <CostRow label="発送費用（全国平均）" value={formatCurrency(cost.sellShipping)} />
              <CostRow
                label={p.priceBand ? '販売価格（想定帯）' : '販売価格（AI想定）'}
                value={
                  p.priceBand
                    ? `${formatCurrency(p.priceBand.sellMin)}〜${formatCurrency(p.priceBand.sellMax)}`
                    : formatCurrency(cost.sellPrice)
                }
                accent
                estimate
              />
              <div className="bg-gray-50 px-3 py-2.5 flex justify-between items-center">
                <span className="text-xs font-bold text-gray-700">純利益（1個・中央値）</span>
                <span className={clsx('text-sm font-bold', getProfitColorClass(cost.profitRate))}>
                  {formatCurrency(cost.profit)}
                  <span className="ml-1 text-xs font-medium">({cost.profitRate.toFixed(1)}%)</span>
                </span>
              </div>
            </div>
            {p.priceBand && (
              <p className="mt-1.5 text-[10px] text-gray-400 leading-snug">
                実際の価格は仕入れ元・セール・出品者で上下します。承認前に下の「買値を確認」「売値を確認」から必ずリンク先の現行価格をチェックしてください。
              </p>
            )}
          </div>

          {/* 難易度 */}
          {rec.difficulty && (
            <div className="rounded-xl bg-white border border-gray-200 p-3">
              <div className="flex items-center gap-2 mb-1.5">
                <p className="text-[11px] font-semibold text-gray-500">せどり難易度</p>
                <span className={clsx('rounded-full px-2 py-0.5 text-[10px] font-bold', DIFFICULTY_BADGE[rec.difficulty])}>
                  {DIFFICULTY_LABEL[rec.difficulty]}
                </span>
                {rec.timeHorizon && (
                  <span className="rounded-full border border-gray-200 px-2 py-0.5 text-[10px] text-gray-600">
                    回転: {rec.timeHorizon === 'short' ? '早い(1-2週)' : rec.timeHorizon === 'medium' ? '中程度(1-2月)' : 'じっくり(3月+)'}
                  </span>
                )}
              </div>
              <p className="text-[11px] text-gray-600 leading-relaxed">{DIFFICULTY_DESC[rec.difficulty]}</p>
            </div>
          )}

          {/* 見つけ方 */}
          {rec.findHint && (
            <div className="rounded-xl bg-sky-50 border border-sky-100 p-3.5">
              <div className="flex items-center gap-1.5 mb-1.5">
                <MapPin className="h-3.5 w-3.5 text-sky-600" />
                <p className="text-[11px] font-bold text-sky-700">見つけ方のヒント</p>
              </div>
              <p className="text-xs text-sky-900 leading-relaxed">{rec.findHint}</p>
            </div>
          )}

          {/* 注意点 */}
          {rec.risks && rec.risks.length > 0 && (
            <div className="rounded-xl bg-rose-50 border border-rose-100 p-3.5">
              <div className="flex items-center gap-1.5 mb-2">
                <ShieldAlert className="h-3.5 w-3.5 text-rose-600" />
                <p className="text-[11px] font-bold text-rose-700">注意点・リスク</p>
              </div>
              <ul className="space-y-1.5">
                {rec.risks.map((risk, i) => (
                  <li key={i} className="text-xs text-rose-900 leading-relaxed flex gap-1.5">
                    <span className="text-rose-400 flex-shrink-0">•</span>
                    <span>{risk}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* サマリー */}
          <div className="grid grid-cols-2 gap-2">
            <SummaryBox label="総投資額" value={formatCurrency(totalInvestment)} sub={`${rec.buyQuantity}個分`} />
            <SummaryBox label="月間想定利益" value={formatCurrency(monthlyProfit)} sub={`月${rec.estimatedMonthlySales}個販売時`} highlight />
          </div>

          {/* 予算警告 */}
          {overBudget && (
            <div className="rounded-xl bg-red-50 border border-red-200 p-3 flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 text-red-500 flex-shrink-0 mt-0.5" />
              <div className="text-[11px] text-red-700 leading-relaxed">
                今月の予算残金（{formatCurrency(budgetRemaining!)}）を超える仕入れです。
                数量を減らすか、設定から予算を調整してください。
              </div>
            </div>
          )}

          {/* 承認前の価格確認 — 一番大事なアクション */}
          <div className="rounded-xl border-2 border-indigo-200 bg-indigo-50/50 p-3">
            <div className="flex items-center gap-1.5 mb-2">
              <Info className="h-3.5 w-3.5 text-indigo-500" />
              <p className="text-[11px] font-bold text-indigo-700">
                承認前に価格をご確認ください
              </p>
            </div>
            <p className="text-[10px] text-indigo-600 mb-2.5 leading-relaxed">
              表示の販売価格はAIの想定です。実際の相場は必ず売り切れ商品で確認してください。
            </p>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setLinkMode('buy')}
                className="flex flex-col items-center justify-center gap-0.5 rounded-xl bg-white border border-gray-200 py-2.5 hover:border-indigo-400 transition-colors text-left"
              >
                <div className="flex items-center gap-1 text-[10px] font-bold text-gray-500">
                  <ExternalLink className="h-2.5 w-2.5" />買値を確認
                  <ChevronRight className="h-2.5 w-2.5 text-gray-300" />
                </div>
                <div className="text-[11px] font-bold text-gray-900">
                  {PLATFORM_SHORT[p.sourcePlatform]}の候補を選ぶ
                </div>
                <div className="text-[9px] text-gray-400">
                  現在価格 {formatCurrency(cost.buyPrice)} ／候補 {buyCandidates.length}件
                </div>
              </button>
              <button
                type="button"
                onClick={() => setLinkMode('sell')}
                className="flex flex-col items-center justify-center gap-0.5 rounded-xl bg-white border border-gray-200 py-2.5 hover:border-indigo-400 transition-colors text-left"
              >
                <div className="flex items-center gap-1 text-[10px] font-bold text-gray-500">
                  <Search className="h-2.5 w-2.5" />売値を確認
                  <ChevronRight className="h-2.5 w-2.5 text-gray-300" />
                </div>
                <div className="text-[11px] font-bold text-gray-900">
                  {PLATFORM_SHORT[p.sellPlatform]}の候補を選ぶ
                </div>
                <div className="text-[9px] text-gray-400">
                  AI想定 {formatCurrency(cost.sellPrice)} ／候補 {sellCandidates.length}件
                </div>
              </button>
            </div>
            {amazonCart && (
              <a
                href={amazonCart}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 flex items-center justify-center gap-1 rounded-xl border border-orange-300 bg-orange-50 py-2 text-[11px] font-bold text-orange-700 hover:bg-orange-100 transition-colors"
              >
                <ShoppingCart className="h-3 w-3" />
                問題なければ Amazon カートに追加
              </a>
            )}
          </div>

          {/* AI理由 */}
          <div className="rounded-xl bg-indigo-50 border border-indigo-100 p-3.5">
            <p className="text-[10px] font-semibold text-indigo-500 mb-1.5">AI分析</p>
            <p className="text-xs text-indigo-800 leading-relaxed">{rec.reason}</p>
            <div className="mt-2 flex items-center gap-1">
              <div className="flex-1 h-1 rounded-full bg-indigo-200 overflow-hidden">
                <div className="h-full rounded-full bg-indigo-500" style={{ width: `${rec.confidence}%` }} />
              </div>
              <span className="text-[10px] font-bold text-indigo-500 flex-shrink-0">信頼度 {rec.confidence}%</span>
            </div>
          </div>
        </div>

        {/* ボタン */}
        <div className="flex gap-3 px-5 pb-6">
          <button
            onClick={() => handle('reject')}
            disabled={loading !== null}
            className={clsx(
              'flex-1 rounded-xl border border-gray-200 py-3 text-sm font-medium text-gray-600 transition-all',
              loading ? 'opacity-40 cursor-not-allowed' : 'hover:bg-gray-50 active:scale-95'
            )}
          >
            {loading === 'reject' ? '処理中…' : '見送る'}
          </button>
          <button
            onClick={() => handle('approve')}
            disabled={loading !== null}
            className={clsx(
              'flex-1 rounded-xl bg-indigo-600 py-3 text-sm font-bold text-white transition-all flex items-center justify-center gap-2',
              loading ? 'opacity-60 cursor-not-allowed' : 'hover:bg-indigo-700 active:scale-95'
            )}
          >
            {loading === 'approve' ? '処理中…' : <><CheckCircle2 className="h-4 w-4" />承認して仕入れる</>}
          </button>
        </div>
      </div>

      {linkMode === 'buy' && (
        <LinkChoiceModal
          title={`${PLATFORM_LABELS[p.sourcePlatform]}で買値を確認`}
          subtitle={p.name}
          candidates={buyCandidates}
          onClose={() => setLinkMode(null)}
        />
      )}
      {linkMode === 'sell' && (
        <LinkChoiceModal
          title={`${PLATFORM_LABELS[p.sellPlatform]}で売値（実売）を確認`}
          subtitle={p.name}
          candidates={sellCandidates}
          onClose={() => setLinkMode(null)}
        />
      )}
    </div>
  )
}

function CostRow({ label, value, accent, estimate }: { label: string; value: string; accent?: boolean; estimate?: boolean }) {
  return (
    <div className={clsx('flex justify-between items-center px-3 py-2', accent && 'bg-gray-50')}>
      <span className={clsx('text-xs flex items-center gap-1', accent ? 'font-semibold text-gray-700' : 'text-gray-500')}>
        {label}
        {estimate && <Info className="h-2.5 w-2.5 text-amber-500" />}
      </span>
      <span className={clsx('text-xs font-medium', accent ? 'font-bold text-gray-800' : 'text-gray-700')}>{value}</span>
    </div>
  )
}

function SummaryBox({ label, value, sub, highlight }: { label: string; value: string; sub: string; highlight?: boolean }) {
  return (
    <div className={clsx('rounded-xl p-3', highlight ? 'bg-emerald-50 border border-emerald-200' : 'bg-gray-50 border border-gray-200')}>
      <p className={clsx('text-[10px] mb-0.5', highlight ? 'text-emerald-600' : 'text-gray-400')}>{label}</p>
      <p className={clsx('text-sm font-bold', highlight ? 'text-emerald-700' : 'text-gray-800')}>{value}</p>
      <p className={clsx('text-[10px] mt-0.5', highlight ? 'text-emerald-500' : 'text-gray-400')}>{sub}</p>
    </div>
  )
}
