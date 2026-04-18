'use client'

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import type { MonthlyData } from '@/lib/types'

interface RevenueChartProps {
  data: MonthlyData[]
}

const fmt = (v: number) =>
  v >= 10000 ? `${(v / 10000).toFixed(0)}万` : `${v.toLocaleString()}`

export default function RevenueChart({ data }: RevenueChartProps) {
  return (
    <div className="rounded-2xl border bg-white p-5 shadow-sm">
      <h3 className="text-sm font-semibold text-gray-700 mb-4">月別売上・利益</h3>
      <ResponsiveContainer width="100%" height={220}>
        <AreaChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="revenue" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2} />
              <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="profit" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
              <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
          <YAxis tickFormatter={fmt} tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
          <Tooltip
            formatter={(value: number, name: string) => [
              `¥${value.toLocaleString()}`,
              name === 'revenue' ? '売上' : '利益',
            ]}
            labelStyle={{ fontSize: 12 }}
            contentStyle={{ borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 12 }}
          />
          <Area type="monotone" dataKey="revenue" name="revenue" stroke="#6366f1" fill="url(#revenue)" strokeWidth={2} />
          <Area type="monotone" dataKey="profit" name="profit" stroke="#10b981" fill="url(#profit)" strokeWidth={2} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
