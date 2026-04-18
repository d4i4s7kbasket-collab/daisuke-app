'use client'

import clsx from 'clsx'
import type { SalesRecord } from '@/lib/types'
import { formatCurrency } from '@/lib/calculations'
import { format } from 'date-fns'
import { ja } from 'date-fns/locale'

const PLATFORM_LABELS: Record<string, string> = {
  rakuten: '楽天',
  amazon: 'Amazon',
  mercari: 'メルカリ',
  yahoo: 'Yahoo!',
  paypay: 'PayPay',
}

interface SalesTableProps {
  records: SalesRecord[]
}

export default function SalesTable({ records }: SalesTableProps) {
  return (
    <div className="rounded-2xl border bg-white shadow-sm overflow-hidden">
      <div className="px-5 py-3.5 border-b">
        <h3 className="text-sm font-semibold text-gray-700">販売履歴</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="bg-gray-50 border-b">
              {['商品名', 'カテゴリ', '仕入', '売値', '利益', '利益率', 'プラットフォーム', '日時'].map(
                (h) => (
                  <th key={h} className="px-4 py-2.5 text-left font-medium text-gray-400 whitespace-nowrap">
                    {h}
                  </th>
                )
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {records.map((r) => (
              <tr key={r.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-4 py-3 font-medium text-gray-900 max-w-[180px] truncate">{r.productName}</td>
                <td className="px-4 py-3 text-gray-500">{r.category}</td>
                <td className="px-4 py-3 text-gray-700">{formatCurrency(r.buyPrice)}</td>
                <td className="px-4 py-3 text-gray-700">{formatCurrency(r.sellPrice)}</td>
                <td className="px-4 py-3 font-semibold text-emerald-600">{formatCurrency(r.profit)}</td>
                <td className="px-4 py-3">
                  <span className={clsx('rounded-full px-2 py-0.5 font-medium',
                    r.profitRate >= 30 ? 'bg-emerald-100 text-emerald-700' :
                    r.profitRate >= 15 ? 'bg-amber-100 text-amber-700' :
                    'bg-red-100 text-red-600'
                  )}>
                    {r.profitRate.toFixed(1)}%
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-500">{PLATFORM_LABELS[r.platform]}</td>
                <td className="px-4 py-3 text-gray-400 whitespace-nowrap">
                  {format(new Date(r.soldAt), 'M/d HH:mm', { locale: ja })}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
