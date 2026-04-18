import { NextResponse } from 'next/server'
import { MOCK_SALES } from '@/lib/mockData'
import type { SalesRecord } from '@/lib/types'

let salesRecords: SalesRecord[] = [...MOCK_SALES]

export async function GET() {
  return NextResponse.json({ sales: salesRecords })
}

export async function POST(request: Request) {
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

  salesRecords = [record, ...salesRecords]
  return NextResponse.json({ sale: record }, { status: 201 })
}
