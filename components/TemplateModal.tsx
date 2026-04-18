'use client'

import { useState, useMemo } from 'react'
import { X, Copy, Check, Tag } from 'lucide-react'
import clsx from 'clsx'
import type { Product, Platform } from '@/lib/types'
import { generateAllTemplates } from '@/lib/listingTemplates'
import { PLATFORM_LABELS, formatCurrency } from '@/lib/calculations'

interface Props {
  product: Product
  onClose: () => void
}

const PLATFORM_ORDER: Platform[] = ['mercari', 'yahoo', 'rakuten', 'amazon', 'paypay']

export default function TemplateModal({ product, onClose }: Props) {
  const templates = useMemo(() => generateAllTemplates(product), [product])
  const [selected, setSelected] = useState<Platform>('mercari')
  const [copied, setCopied] = useState<string | null>(null)

  const current = templates.find((t) => t.platform === selected)!

  const copy = async (text: string, key: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(key)
      setTimeout(() => setCopied(null), 1500)
    } catch {
      // ignore
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-t-3xl sm:rounded-3xl bg-white shadow-2xl max-h-[92vh] overflow-y-auto">
        <div className="flex justify-center pt-3 pb-1 sm:hidden">
          <div className="h-1 w-10 rounded-full bg-gray-200" />
        </div>

        <div className="flex items-center justify-between px-5 py-4 border-b">
          <div>
            <h2 className="text-sm font-bold text-gray-900">出品テンプレート</h2>
            <p className="text-[10px] text-gray-400 line-clamp-1">{product.name}</p>
          </div>
          <button onClick={onClose} className="rounded-full p-1.5 hover:bg-gray-100 transition-colors">
            <X className="h-4 w-4 text-gray-400" />
          </button>
        </div>

        {/* プラットフォーム選択 */}
        <div className="px-5 pt-4">
          <div className="flex gap-1.5 overflow-x-auto pb-2">
            {PLATFORM_ORDER.map((p) => (
              <button
                key={p}
                onClick={() => setSelected(p)}
                className={clsx(
                  'whitespace-nowrap rounded-full px-3 py-1.5 text-[11px] font-bold transition-colors',
                  selected === p
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                )}
              >
                {PLATFORM_LABELS[p]}
              </button>
            ))}
          </div>
        </div>

        {/* テンプレート本体 */}
        <div className="px-5 pb-6 space-y-4">
          {/* タイトル */}
          <Field label="タイトル" value={current.title} onCopy={() => copy(current.title, 'title')} copied={copied === 'title'}>
            <p className="text-xs text-gray-800 leading-snug">{current.title}</p>
            <p className="mt-1 text-[10px] text-gray-400">{current.title.length}文字</p>
          </Field>

          {/* 価格 */}
          <Field
            label="販売価格"
            value={String(current.price)}
            onCopy={() => copy(String(current.price), 'price')}
            copied={copied === 'price'}
          >
            <p className="text-base font-bold text-gray-900">{formatCurrency(current.price)}</p>
          </Field>

          {/* 説明文 */}
          <Field label="商品説明" value={current.description} onCopy={() => copy(current.description, 'desc')} copied={copied === 'desc'}>
            <pre className="whitespace-pre-wrap text-xs text-gray-700 leading-relaxed font-sans">
              {current.description}
            </pre>
          </Field>

          {/* タグ */}
          <Field
            label="タグ・キーワード"
            value={current.tags.join(' ')}
            onCopy={() => copy(current.tags.join(' '), 'tags')}
            copied={copied === 'tags'}
          >
            <div className="flex flex-wrap gap-1">
              {current.tags.map((t) => (
                <span key={t} className="inline-flex items-center gap-0.5 rounded-full bg-gray-100 px-2 py-0.5 text-[10px] text-gray-600">
                  <Tag className="h-2.5 w-2.5" />{t}
                </span>
              ))}
            </div>
          </Field>

          {/* 配送方法 */}
          <div className="rounded-xl bg-gray-50 px-3 py-2 text-[11px] text-gray-500">
            推奨配送：<span className="font-bold text-gray-700">{current.shippingMethod}</span>
          </div>
        </div>
      </div>
    </div>
  )
}

function Field({
  label, value, children, onCopy, copied,
}: { label: string; value: string; children: React.ReactNode; onCopy: () => void; copied: boolean }) {
  return (
    <div className="rounded-xl border border-gray-100 bg-white">
      <div className="flex items-center justify-between px-3 py-2 border-b border-gray-50">
        <p className="text-[10px] font-bold text-gray-400">{label}</p>
        <button
          onClick={onCopy}
          className={clsx(
            'flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold transition-colors',
            copied ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          )}
        >
          {copied ? <><Check className="h-2.5 w-2.5" />コピー済</> : <><Copy className="h-2.5 w-2.5" />コピー</>}
        </button>
      </div>
      <div className="px-3 py-3">{children}</div>
    </div>
  )
}
