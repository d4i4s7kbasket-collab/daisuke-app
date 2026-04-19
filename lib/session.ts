import { NextResponse } from 'next/server'
import { accountIdFromToken } from './accountStore'

/**
 * リクエストからログイン中のアカウントIDを取り出すヘルパ。
 *
 * クライアントは `x-account-token` ヘッダ、もしくは Authorization: Bearer <token> で
 * セッショントークンを送る。
 */
export async function requireAccountId(request: Request): Promise<
  { ok: true; accountId: string } | { ok: false; response: NextResponse }
> {
  const token = extractToken(request)
  if (!token) {
    return { ok: false, response: NextResponse.json({ error: '未ログイン' }, { status: 401 }) }
  }
  const accountId = await accountIdFromToken(token)
  if (!accountId) {
    return { ok: false, response: NextResponse.json({ error: 'セッションが無効です' }, { status: 401 }) }
  }
  return { ok: true, accountId }
}

function extractToken(request: Request): string | null {
  const h = request.headers
  const direct = h.get('x-account-token')
  if (direct) return direct
  const auth = h.get('authorization') ?? h.get('Authorization')
  if (auth && auth.toLowerCase().startsWith('bearer ')) return auth.slice(7).trim()
  return null
}
