import { NextResponse } from 'next/server'
import { listRecommendations, updateRecommendationStatus } from '@/lib/recStore'
import { addInventory } from '@/lib/inventoryStore'
import { requireAccountId } from '@/lib/session'

export const runtime = 'nodejs'

export async function GET(request: Request) {
  const auth = await requireAccountId(request)
  if (!auth.ok) return auth.response
  const recommendations = await listRecommendations(auth.accountId)
  return NextResponse.json({ recommendations })
}

export async function PATCH(request: Request) {
  const auth = await requireAccountId(request)
  if (!auth.ok) return auth.response
  const { id, status } = await request.json()

  if (!id || !['approved', 'rejected'].includes(status)) {
    return NextResponse.json({ error: '無効なリクエスト' }, { status: 400 })
  }

  // 現在の状態を引いて、承認遷移なら在庫に追加する
  const before = (await listRecommendations(auth.accountId)).find((r) => r.id === id)
  if (!before) return NextResponse.json({ error: '見つかりません' }, { status: 404 })

  let added = null
  if (status === 'approved' && before.status !== 'approved') {
    added = await addInventory(
      auth.accountId,
      before.product,
      before.buyQuantity,
      `AI提案から承認（信頼度${before.confidence}%）`,
    )
  }

  const updated = await updateRecommendationStatus(auth.accountId, id, status)
  return NextResponse.json({ recommendation: updated, inventory: added })
}
