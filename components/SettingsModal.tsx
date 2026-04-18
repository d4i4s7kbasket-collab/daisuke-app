'use client'

import { useState } from 'react'
import { X, MapPin, CheckCircle2, Wallet } from 'lucide-react'
import { PREFECTURES } from '@/lib/shipping'
import type { UserSettings } from '@/lib/settings'
import { getAverageShippingCost } from '@/lib/shipping'
import { formatCurrency } from '@/lib/calculations'
import clsx from 'clsx'

interface SettingsModalProps {
  settings: UserSettings
  onSave: (s: UserSettings) => void
  onClose: () => void
}

export default function SettingsModal({ settings, onSave, onClose }: SettingsModalProps) {
  const [form, setForm] = useState<UserSettings>(settings)
  const [saved, setSaved] = useState(false)

  const avgShipping = getAverageShippingCost(form.prefecture)

  const handleSave = () => {
    onSave(form)
    setSaved(true)
    setTimeout(() => { setSaved(false); onClose() }, 800)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="w-full max-w-sm rounded-t-3xl sm:rounded-3xl bg-white shadow-2xl">
        <div className="flex justify-center pt-3 pb-1 sm:hidden">
          <div className="h-1 w-10 rounded-full bg-gray-200" />
        </div>

        <div className="flex items-center justify-between px-5 py-4 border-b">
          <h2 className="text-sm font-bold text-gray-900">設定</h2>
          <button onClick={onClose} className="rounded-full p-1.5 hover:bg-gray-100">
            <X className="h-4 w-4 text-gray-400" />
          </button>
        </div>

        <div className="p-5 space-y-5">
          {/* 名前 */}
          <div>
            <label className="text-xs font-semibold text-gray-600 block mb-1.5">お名前（任意）</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="例: 田中 太郎"
              className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
            />
          </div>

          {/* 都道府県 */}
          <div>
            <label className="text-xs font-semibold text-gray-600 block mb-1.5">
              <MapPin className="inline h-3 w-3 mr-1 text-indigo-500" />
              居住地（都道府県）
            </label>
            <select
              value={form.prefecture}
              onChange={(e) => setForm({ ...form, prefecture: e.target.value as typeof form.prefecture })}
              className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-white"
            >
              {PREFECTURES.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>

            {/* 配送料プレビュー */}
            <div className="mt-2 flex items-center gap-2 rounded-xl bg-indigo-50 border border-indigo-100 px-3 py-2">
              <MapPin className="h-3.5 w-3.5 text-indigo-400 flex-shrink-0" />
              <div className="text-xs text-indigo-700">
                <span className="font-semibold">{form.prefecture}</span>発送の全国平均配送料：
                <span className="font-bold ml-1">{formatCurrency(avgShipping)}</span>
                <span className="text-indigo-400 ml-1">（ヤマト60サイズ）</span>
              </div>
            </div>
          </div>

          {/* 月間予算 */}
          <div>
            <label className="text-xs font-semibold text-gray-600 block mb-1.5">
              <Wallet className="inline h-3 w-3 mr-1 text-indigo-500" />
              今月の仕入れ予算
            </label>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500">¥</span>
              <input
                type="number"
                min={0}
                step={10000}
                value={form.monthlyBudget}
                onChange={(e) => setForm({ ...form, monthlyBudget: Number(e.target.value) || 0 })}
                className="flex-1 rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
              />
            </div>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {[50000, 100000, 200000, 500000].map((v) => (
                <button
                  key={v}
                  onClick={() => setForm({ ...form, monthlyBudget: v })}
                  className={clsx(
                    'rounded-full px-3 py-1 text-[11px] font-bold transition-colors',
                    form.monthlyBudget === v
                      ? 'bg-indigo-600 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  )}
                >
                  {formatCurrency(v)}
                </button>
              ))}
            </div>
          </div>

          {/* 説明 */}
          <div className="rounded-xl bg-gray-50 p-3 text-xs text-gray-500 space-y-1">
            <p>設定した都道府県をもとに、利益計算の発送費用を自動調整します。</p>
            <p>月間予算を超えそうな提案はアプリが警告します。</p>
          </div>
        </div>

        <div className="px-5 pb-6">
          <button
            onClick={handleSave}
            className={clsx(
              'w-full rounded-xl py-3 text-sm font-bold text-white transition-all flex items-center justify-center gap-2',
              saved ? 'bg-emerald-500' : 'bg-indigo-600 hover:bg-indigo-700 active:scale-95'
            )}
          >
            {saved ? <><CheckCircle2 className="h-4 w-4" />保存しました</> : '保存する'}
          </button>
        </div>
      </div>
    </div>
  )
}
