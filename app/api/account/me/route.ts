import { NextResponse } from 'next/server'
import { getPublicAccount, revokeSession, accountIdFromToken } from '@/lib/accountStore'
import { requireAccountId } from '@/lib/session'

export const runtime = 'nodejs'

export async function GET(request: Request) {
  const auth = await requireAccountId(request)
  if (!auth.ok) return auth.response
  const account = await getPublicAccount(auth.accountId)
  if (!account) return NextResponse.json({ error: 'アカウントが見つかりません' }, { status: 404 })
  return NextResponse.json({ account })
}

/** ログアウト。セッショントークンを無効化する。 */
export async function DELETE(request: Request) {
  const token = request.headers.get('x-account-token')
    ?? (request.headers.get('authorization')?.replace(/^Bearer\s+/i, '') ?? null)
  if (token) {
    // 有効なトークンだったら無効化（既に無効でもエラーにはしない）
    const accountId = await accountIdFromToken(token)
    if (accountId) await revokeSession(token)
  }
  return NextResponse.json({ ok: true })
}
