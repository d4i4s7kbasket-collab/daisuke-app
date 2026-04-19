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

  // 'pending' は「承認/見送りを取り消して元に戻す」ための遷移
  if (!id || !['approved', 'rejected', 'pending'].includes(status)) {
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

  // pending に戻す場合は在庫側は触らない（すでに出品済み/売却済みかもしれないため）。
  // 在庫を消したい場合はユーザーが在庫タブから明示的に削除する。

  const updated = await updateRecommendationStatus(auth.accountId, id, status)
  return NextResponse.json({ recommendation: updated, inventory: added })
}
