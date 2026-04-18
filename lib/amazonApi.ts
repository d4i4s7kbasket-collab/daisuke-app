import type { Product } from './types'
import { calcCost } from './calculations'

/**
 * Amazon 商品検索
 * 正式には PA-API（Product Advertising API）の利用を推奨。
 * PA-API は審査が必要なため、ここでは以下の3段構え：
 *   1. PA-API（AMAZON_ACCESS_KEY 等が設定済みなら）
 *   2. RapidAPI 経由の Amazon Data API（RAPIDAPI_KEY が設定済みなら）
 *   3. モック（未設定時）
 */

const ACCESS_KEY = process.env.AMAZON_ACCESS_KEY ?? ''
const SECRET_KEY = process.env.AMAZON_SECRET_KEY ?? ''
const PARTNER_TAG = process.env.AMAZON_PARTNER_TAG ?? ''
const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY ?? ''

export function hasAmazonCredentials(): boolean {
  return Boolean((ACCESS_KEY && SECRET_KEY && PARTNER_TAG) || RAPIDAPI_KEY)
}

interface AmazonSearchParams {
  keyword: string
  hits?: number
}

interface RapidApiItem {
  asin: string
  product_title: string
  product_photo: string
  product_url: string
  product_price?: string
  product_star_rating?: string
  product_num_ratings?: number
}

/** RapidAPI の Real-Time Amazon Data を利用した検索 */
async function searchViaRapidApi(params: AmazonSearchParams): Promise<Product[]> {
  const url = `https://real-time-amazon-data.p.rapidapi.com/search?query=${encodeURIComponent(
    params.keyword
  )}&country=JP&page=1`
  const res = await fetch(url, {
    headers: {
      'x-rapidapi-key': RAPIDAPI_KEY,
      'x-rapidapi-host': 'real-time-amazon-data.p.rapidapi.com',
    },
  })
  if (!res.ok) throw new Error(`Amazon API エラー: ${res.status}`)
  const json = await res.json()
  const items: RapidApiItem[] = (json.data?.products ?? []).slice(0, params.hits ?? 10)

  return items.map((item, index) => {
    const priceStr = item.product_price ?? '0'
    const buyPrice = parseInt(priceStr.replace(/[^\d]/g, ''), 10) || 0
    const sellPrice = Math.round(buyPrice * 1.35)
    const cost = calcCost(buyPrice, sellPrice, 'mercari', 0)
    const reviewCount = item.product_num_ratings ?? 0
    const salesVelocity = reviewCount > 3000 ? 'high' : reviewCount > 500 ? 'medium' : 'low'

    return {
      id: `amz-${item.asin}`,
      name: item.product_title,
      imageUrl: item.product_photo,
      url: item.product_url,
      category: 'その他',
      sourcePlatform: 'amazon',
      sellPlatform: 'mercari',
      cost,
      salesVelocity,
      rank: index + 1,
      reviewCount,
      rating: parseFloat(item.product_star_rating ?? '0') || 0,
      lastUpdated: new Date().toISOString(),
    } satisfies Product
  })
}

export async function searchAmazonItems(params: AmazonSearchParams): Promise<Product[]> {
  if (RAPIDAPI_KEY) return searchViaRapidApi(params)
  // PA-API 実装は credentials 取得後に追加予定。現状は credentials なしで呼ばれたら空配列。
  return []
}
