import { NextResponse } from 'next/server'
import { MOCK_TRENDS, MOCK_DASHBOARD } from '@/lib/mockData'

export const revalidate = 3600

export async function GET() {
  return NextResponse.json({
    trends: MOCK_TRENDS,
    dashboard: MOCK_DASHBOARD,
    updatedAt: new Date().toISOString(),
  })
}
