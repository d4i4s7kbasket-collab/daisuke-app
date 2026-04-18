import { NextResponse } from 'next/server'
import { MOCK_RECOMMENDATIONS } from '@/lib/mockData'
import { addInventory } from '@/lib/inventoryStore'

const globalStore = globalThis as unknown as {
  __sedoriRecs?: { items: typeof MOCK_RECOMMENDATIONS }
}
if (!globalStore.__sedoriRecs) globalStore.__sedoriRecs = { items: [...MOCK_RECOMMENDATIONS] }
const recStore = globalStore.__sedoriRecs

export async function GET() {
  return NextResponse.json({ recommendations: recStore.items })
}

export async function PATCH(request: Request) {
  const { id, status } = await request.json()

  if (!id || !['approved', 'rejected'].includes(status)) {
    return NextResponse.json({ error: '無効なリクエスト' }, { status: 400 })
  }

  let added = null
  recStore.items = recStore.items.map((r) => {
    if (r.id !== id) return r
    // 承認されたら在庫に追加（すでに承認済みの場合はスキップ）
    if (status === 'approved' && r.status !== 'approved') {
      added = addInventory(r.product, r.buyQuantity, `AI提案から承認（信頼度${r.confidence}%）`)
    }
    return { ...r, status }
  })

  const updated = recStore.items.find((r) => r.id === id)
  return NextResponse.json({ recommendation: updated, inventory: added })
}
