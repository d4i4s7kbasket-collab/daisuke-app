import { NextResponse } from 'next/server'
import { requireAccountId } from '@/lib/session'
import { getSettings, putSettings } from '@/lib/settingsStore'
import type { UserSettings } from '@/lib/settings'

export const runtime = 'nodejs'

export async function GET(request: Request) {
  const auth = await requireAccountId(request)
  if (!auth.ok) return auth.response
  const settings = await getSettings(auth.accountId)
  return NextResponse.json({ settings })
}

export async function PUT(request: Request) {
  const auth = await requireAccountId(request)
  if (!auth.ok) return auth.response
  const body = (await request.json()) as Partial<UserSettings>
  const current = await getSettings(auth.accountId)
  // サーバー側で最小限のバリデーション（型のゆらぎを吸収）
  const next: UserSettings = {
    ...current,
    ...body,
    monthlyBudget: Number(body.monthlyBudget ?? current.monthlyBudget) || 0,
    budgetAdjustments: Array.isArray(body.budgetAdjustments)
      ? body.budgetAdjustments
      : (current.budgetAdjustments ?? []),
  }
  const saved = await putSettings(auth.accountId, next)
  return NextResponse.json({ settings: saved })
}
