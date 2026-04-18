import type { Product, Platform } from './types'

/**
 * 各プラットフォームのディープリンク生成。
 * 公式APIでの購入・出品自動化は規約上不可のため、
 * 「ワンクリックで該当商品ページを開く」までをアプリが担当する。
 *
 * URLが有効な商品ページでない場合は検索URLに自動フォールバック。
 */

function clean(name: string): string {
  return name
    .replace(/【[^】]*】/g, '')
    .replace(/\([^)]*\)/g, '')
    .replace(/（[^）]*）/g, '')
    .replace(/\s{2,}/g, ' ')
    .trim()
}

function shortName(name: string, len = 60): string {
  return clean(name).slice(0, len)
}

/** 渡された URL が特定プラットフォームの商品ページに見えるかを判定 */
function looksLikeProductUrl(url: string, platform: Platform): boolean {
  if (!url) return false
  try {
    const u = new URL(url)
    if (platform === 'amazon') {
      if (!u.hostname.includes('amazon.')) return false
      return /\/dp\/|\/gp\/product\//.test(u.pathname)
    }
    if (platform === 'rakuten') {
      if (!u.hostname.includes('rakuten.co.jp')) return false
      // 楽天の商品ページは /shop/item/ か /shop/itemName/ などパスが長い
      const parts = u.pathname.split('/').filter(Boolean)
      return parts.length >= 2 && !u.hostname.startsWith('www.')
    }
    if (platform === 'yahoo') {
      return /store\.shopping\.yahoo/.test(u.hostname) || /yahoo-shoten/.test(u.pathname)
    }
    if (platform === 'mercari') {
      return u.hostname.includes('mercari') && /\/item\//.test(u.pathname)
    }
  } catch {
    return false
  }
  return false
}

function searchUrl(platform: Platform, query: string): string {
  const q = encodeURIComponent(query)
  switch (platform) {
    case 'amazon':  return `https://www.amazon.co.jp/s?k=${q}`
    case 'rakuten': return `https://search.rakuten.co.jp/search/mall/${q}/`
    case 'yahoo':   return `https://shopping.yahoo.co.jp/search?p=${q}`
    case 'mercari': return `https://jp.mercari.com/search?keyword=${q}`
    case 'paypay':  return `https://paypayfleamarket.yahoo.co.jp/search/${q}`
  }
}

/**
 * 仕入れ元の商品ページ URL。
 * 正規の商品ページに見えればそれを返し、そうでなければ検索結果URLを返す。
 */
export function buyUrl(product: Product): string {
  if (looksLikeProductUrl(product.url, product.sourcePlatform)) return product.url
  return searchUrl(product.sourcePlatform, shortName(product.name))
}

/**
 * 販売先の相場確認 URL。
 * 各プラットフォームの「売り切れ済み（実売価格）」に優先して飛ばす。
 */
export function sellPriceCheckUrl(product: Product, platform?: Platform): string {
  const p = platform ?? product.sellPlatform
  const q = encodeURIComponent(shortName(product.name))
  switch (p) {
    case 'mercari':
      // 売り切れのみ → 実際に売れた価格がわかる
      return `https://jp.mercari.com/search?keyword=${q}&status=sold_out`
    case 'yahoo':
      // ヤフオク終了済み落札相場
      return `https://auctions.yahoo.co.jp/closedsearch/closedsearch?p=${q}`
    case 'rakuten':
      return `https://search.rakuten.co.jp/search/mall/${q}/?s=12` // 売れている順
    case 'amazon':
      return `https://www.amazon.co.jp/s?k=${q}&s=review-rank`
    case 'paypay':
      return `https://paypayfleamarket.yahoo.co.jp/search/${q}?sort=updatedAt&order=desc`
    default:
      return searchUrl(p, shortName(product.name))
  }
}

/** Amazon カート直接追加（ASIN 抽出できる場合のみ） */
export function amazonCartUrl(product: Product): string | null {
  const fromId = product.id.match(/amz-([A-Z0-9]{10})/i)?.[1]
  const fromUrl = product.url.match(/\/(?:dp|gp\/product)\/([A-Z0-9]{10})/i)?.[1]
  const asin = fromId ?? fromUrl
  if (!asin) return null
  return `https://www.amazon.co.jp/gp/aws/cart/add.html?ASIN.1=${asin}&Quantity.1=1`
}

/** 販売先で出品や競合を見るためのURL（相場確認と同じ挙動） */
export function listingUrl(product: Product, platform: Platform): string {
  return sellPriceCheckUrl(product, platform)
}
