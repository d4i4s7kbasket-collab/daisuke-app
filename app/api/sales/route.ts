import { NextResponse } from 'next/server'
import type { SalesRecord } from '@/lib/types'
import { addSale, listSales } from '@/lib/salesStore'
import { requireAccountId } from '@/lib/session'

export const runtime = 'nodejs'

export async function GET(request: Request) {
  const auth = await requireAccountId(request)
  if (!auth.ok) return auth.response
  const sales = await listSales(auth.accountId)
  return NextResponse.json({ sales })
}

export async function POST(request: Request) {
  const auth = await requireAccountId(request)
  if (!auth.ok) return auth.response
  const body = await request.json()

  const record: SalesRecord = {
    id: `s${Date.now()}`,
    productName: body.productName,
    category: body.category ?? 'その他',
    buyPrice: Number(body.buyPrice),
    sellPrice: Number(body.sellPrice),
    quantity: Number(body.quantity) || 1,
    profit: (Number(body.sellPrice) - Number(body.buyPrice)) * (Number(body.quantity) || 1),
    profitRate: ((Number(body.sellPrice) - Number(body.buyPrice)) / Number(body.buyPrice)) * 100,
    platform: body.platform,
    soldAt: new Date().toISOString(),
  }

  await addSale(auth.accountId, record)
  return NextResponse.json({ sale: record }, { status: 201 })
}
