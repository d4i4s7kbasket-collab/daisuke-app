import type { Platform, PlatformQuote, ScanResult } from './types'
import { PLATFORM_FEES } from './calculations'
import { estimateQuoteSet } from './storeDeals'

/**
 * 店頭価格・商品名（または JAN）から、各プラットフォームの利益試算を生成。
 * - 仕入れ送料は店舗せどりなので 0
 * - 販売手数料はプラットフォーム別
 * - 発送費用は全国平均（930円）で仮置き
 * - 販売価格は storeDeals.estimateQuoteSet() のキーワード推定で生成
 *
 * 相場はあくまで目安。実売価格は必ずリンク先で確認する運用。
 */
export function buildScanResult(params: {
  query: string
  inStorePrice: number
  imageDataUrl?: string
  sellShipping?: number
}): ScanResult {
  const { query, inStorePrice, imageDataUrl, sellShipping = 930 } = params
  const estimates = estimateQuoteSet({ query, inStorePrice })

  const quotes: PlatformQuote[] = estimates.map((e) => {
    const platformFee = Math.round(e.estimatedSellPrice * (PLATFORM_FEES[e.platform] ?? 0.10))
    const profit = e.estimatedSellPrice - platformFee - sellShipping - inStorePrice
    const profitRate = inStorePrice > 0 ? (profit / inStorePrice) * 100 : 0
    return {
      platform: e.platform,
      sellPrice: e.estimatedSellPrice,
      platformFee,
      sellShipping,
      profit,
      profitRate,
      confidence: e.confidence,
      note: e.note,
    }
  })

  // 利益が最大のプラットフォームを選択
  const best = quotes.reduce((acc, q) => (q.profit > acc.profit ? q : acc), quotes[0])

  return {
    query,
    imageDataUrl,
    inStorePrice,
    quotes,
    bestPlatform: best.platform,
  }
}
