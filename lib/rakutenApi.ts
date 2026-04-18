import type { Product } from './types'
import { calcCost } from './calculations'

const RAKUTEN_APP_ID = process.env.RAKUTEN_APP_ID ?? ''
const BASE_URL = 'https://app.rakuten.co.jp/services/api/IchibaItem/Search/20170706'

interface RakutenItem {
  itemName: string
  itemPrice: number
  itemUrl: string
  mediumImageUrls: Array<{ imageUrl: string }>
  itemCode: string
  reviewCount: number
  reviewAverage: number
}

interface RakutenSearchParams {
  keyword: string
  hits?: number
  page?: number
  sort?: string
}

export async function searchRakutenItems(params: RakutenSearchParams): Promise<Product[]> {
  if (!RAKUTEN_APP_ID || RAKUTEN_APP_ID === 'your_rakuten_app_id') {
    throw new Error('RAKUTEN_APP_ID not configured')
  }

  const searchParams = new URLSearchParams({
    applicationId: RAKUTEN_APP_ID,
    keyword: params.keyword,
    hits: String(params.hits ?? 10),
    page: String(params.page ?? 1),
    sort: params.sort ?? '-reviewCount',
    imageFlag: '1',
    minPrice: '1000',
    format: 'json',
  })

  const res = await fetch(`${BASE_URL}?${searchParams}`)
  if (!res.ok) throw new Error(`楽天API エラー: ${res.status}`)

  const data = await res.json()
  const items: RakutenItem[] = data.Items?.map((i: { Item: RakutenItem }) => i.Item) ?? []

  return items.map((item, index) => {
    const buyPrice = item.itemPrice
    const sellPrice = Math.round(buyPrice * 1.4)
    const cost = calcCost(buyPrice, sellPrice, 'mercari', 500)
    const salesVelocity = item.reviewCount > 3000 ? 'high' : item.reviewCount > 500 ? 'medium' : 'low'

    return {
      id: item.itemCode,
      name: item.itemName,
      imageUrl: item.mediumImageUrls?.[0]?.imageUrl ?? '',
      url: item.itemUrl,
      category: 'その他',
      sourcePlatform: 'rakuten',
      sellPlatform: 'mercari',
      cost,
      salesVelocity,
      rank: index + 1,
      reviewCount: item.reviewCount,
      rating: item.reviewAverage,
      lastUpdated: new Date().toISOString(),
    } satisfies Product
  })
}

export const SEDORI_KEYWORDS = [
  'Nintendo Switch 本体',
  'ポケモンカード BOX',
  'LEGO テクニック',
  'AirPods Pro',
]
