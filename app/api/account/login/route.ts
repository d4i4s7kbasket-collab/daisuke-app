import { NextResponse } from 'next/server'
import { loginAccount } from '@/lib/accountStore'

export const runtime = 'nodejs'

export async function POST(request: Request) {
  try {
    const { nickname, pin } = await request.json()
    const result = await loginAccount(String(nickname ?? ''), String(pin ?? ''))
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 401 })
    }
    return NextResponse.json({ account: result.account, token: result.token })
  } catch (err) {
    console.error('login error', err)
    return NextResponse.json({ error: 'サーバーエラー' }, { status: 500 })
  }
}
