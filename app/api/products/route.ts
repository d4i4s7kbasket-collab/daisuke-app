import { NextResponse } from 'next/server'
import { searchRakutenItems, SEDORI_KEYWORDS } from '@/lib/rakutenApi'
import { searchAmazonItems, hasAmazonCredentials } from '@/lib/amazonApi'
import { MOCK_PRODUCTS } from '@/lib/mockData'
import type { Product } from '@/lib/types'

export const revalidate = 3600

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const keyword = searchParams.get('keyword') ?? ''
  const source = searchParams.get('source') ?? 'all' // 'rakuten' | 'amazon' | 'all'

  const hasRakuten = process.env.RAKUTEN_APP_ID && process.env.RAKUTEN_APP_ID !== 'your_rakuten_app_id'
  const hasAmazon = hasAmazonCredentials()

  if (!hasRakuten && !hasAmazon) {
    const filtered = keyword
      ? MOCK_PRODUCTS.filter((p) => p.name.includes(keyword) || p.category.includes(keyword))
      : MOCK_PRODUCTS
    return NextResponse.json({ products: filtered, source: 'mock' })
  }

  try {
    const keywords = keyword ? [keyword] : SEDORI_KEYWORDS.slice(0, 3)
    const tasks: Promise<Product[]>[] = []

    keywords.forEach((kw) => {
      if (hasRakuten && (source === 'all' || source === 'rakuten')) {
        tasks.push(searchRakutenItems({ keyword: kw, hits: 5 }))
      }
      if (hasAmazon && (source === 'all' || source === 'amazon')) {
        tasks.push(searchAmazonItems({ keyword: kw, hits: 5 }))
      }
    })

    const results = await Promise.all(tasks.map((p) => p.catch(() => [] as Product[])))
    const products = results.flat()
    // 利益率で降順ソート（せどりの肝）
    products.sort((a, b) => b.cost.profitRate - a.cost.profitRate)

    return NextResponse.json({
      products: products.length > 0 ? products : MOCK_PRODUCTS,
      source: products.length > 0 ? 'live' : 'mock_fallback',
    })
  } catch (err) {
    console.error('Product API error:', err)
    return NextResponse.json({ products: MOCK_PRODUCTS, source: 'mock_fallback' })
  }
}
