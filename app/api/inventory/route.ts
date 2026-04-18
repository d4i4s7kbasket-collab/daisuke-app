import { NextResponse } from 'next/server'
import {
  listInventory,
  addInventory,
  updateInventory,
  removeInventory,
  inventoryStats,
} from '@/lib/inventoryStore'

export async function GET() {
  const items = listInventory()
  return NextResponse.json({ items, stats: inventoryStats(items) })
}

export async function POST(request: Request) {
  const body = await request.json()
  const { product, quantity, memo } = body ?? {}
  if (!product || !quantity) {
    return NextResponse.json({ error: 'product と quantity が必要です' }, { status: 400 })
  }
  const item = addInventory(product, Number(quantity), memo)
  return NextResponse.json({ item })
}

export async function PATCH(request: Request) {
  const body = await request.json()
  const { id, ...patch } = body ?? {}
  if (!id) return NextResponse.json({ error: 'id が必要です' }, { status: 400 })
  const item = updateInventory(id, patch)
  if (!item) return NextResponse.json({ error: '見つかりません' }, { status: 404 })
  return NextResponse.json({ item })
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id が必要です' }, { status: 400 })
  const ok = removeInventory(id)
  return NextResponse.json({ ok })
}
