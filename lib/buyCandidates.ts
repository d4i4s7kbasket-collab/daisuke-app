import type { Product, Platform } from './types'

/**
 * 候補URL生成ユーティリティ。
 *
 * 「検索結果の一覧ページに飛ばす」だけでは欲しい商品を特定しにくいため、
 * このモジュールでは:
 *   1. もしその商品ページの直リンクが手元にあれば「直接」候補を最上位に
 *   2. それに加えて、商品名・ブランド・コンディションで絞った
 *      「複数の絞り込み候補URL」を並べて返す。
 *
 * UI 側（LinkChoiceModal）で候補を一覧表示し、ユーザーがタップして選べるようにする。
 */

export type CandidateKind = 'direct' | 'sold' | 'newest' | 'cheapest' | 'search' | 'refined'

export interface UrlCandidate {
  /** モーダルに表示するラベル（短く） */
  label: string
  /** 補足説明（何で絞ってるかの1行） */
  note?: string
  /** 実際に飛ぶ URL */
  url: string
  /** プラットフォーム（バッジ色付け用） */
  platform: Platform
  /** 種別。direct は商品直リンク、それ以外は検索系 */
  kind: CandidateKind
}

function clean(name: string): string {
  return name
    .replace(/【[^】]*】/g, '')
    .replace(/\([^)]*\)/g, '')
    .replace(/（[^）]*）/g, '')
    .replace(/\s{2,}/g, ' ')
    .trim()
}

function short(name: string, len = 60): string {
  return clean(name).slice(0, len)
}

/** 商品名の先頭から "ブランド名らしいもの" を雑に抽出 */
function brandLike(name: string): string | null {
  const c = clean(name)
  // 先頭の英字ブランド or 最初のスペースまで
  const m = c.match(/^([A-Za-z][A-Za-z0-9&\-]*|[ぁ-んァ-ヶ一-龥A-Za-z0-9]+)(\s|　|$)/)
  if (!m) return null
  const b = m[1]
  if (b.length < 2 || b.length > 16) return null
  return b
}

/** Amazon ASIN を product から取り出す（id / url どちらからでも） */
function extractAsin(product: Product): string | null {
  const fromId = product.id.match(/amz-([A-Z0-9]{10})/i)?.[1]
  const fromUrl = product.url.match(/\/(?:dp|gp\/product)\/([A-Z0-9]{10})/i)?.[1]
  return fromId ?? fromUrl ?? null
}

/** URL が特定プラットフォームの "商品ページっぽい" URL かを判定 */
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

function enc(q: string): string {
  return encodeURIComponent(q)
}

/* =========================================================================
 * 仕入れ候補（買値確認）
 * ========================================================================= */

/**
 * 仕入れ元プラットフォームでの「買値を確認する候補URL」一式。
 * - 直リンクが取れていれば最上位に "direct"
 * - そのうえで絞り込みや並べ替えの候補を並べる
 */
export function buildBuyCandidates(product: Product): UrlCandidate[] {
  const p = product.sourcePlatform
  const name = short(product.name)
  const brand = brandLike(product.name)
  const out: UrlCandidate[] = []

  // --- 直リンクが妥当ならトップに出す -------------------------------------
  if (product.url && looksLikeProductUrl(product.url, p)) {
    out.push({
      platform: p,
      kind: 'direct',
      label: 'この商品の直リンク',
      note: '参考になった商品ページへ直接移動',
      url: product.url,
    })
  }

  // Amazon ASIN が取れれば /dp/ASIN も直リンクとして追加
  if (p === 'amazon') {
    const asin = extractAsin(product)
    if (asin) {
      const directDp = `https://www.amazon.co.jp/dp/${asin}`
      if (!out.some((c) => c.url === directDp)) {
        out.push({
          platform: 'amazon',
          kind: 'direct',
          label: `Amazon 商品ページ (ASIN: ${asin})`,
          note: 'ASIN から直リンク',
          url: directDp,
        })
      }
    }
  }

  // --- プラットフォーム別の絞り込み候補 -----------------------------------
  switch (p) {
    case 'amazon':
      out.push(
        {
          platform: 'amazon',
          kind: 'refined',
          label: '新品のみで検索',
          note: 'Amazon 販売・新品条件',
          url: `https://www.amazon.co.jp/s?k=${enc(name)}&i=new&rh=p_n_condition-type%3A2224371051`,
        },
        {
          platform: 'amazon',
          kind: 'refined',
          label: 'プライム対応のみ',
          note: '発送が早い出品に絞り込み',
          url: `https://www.amazon.co.jp/s?k=${enc(name)}&rh=p_85%3A2082187051`,
        },
        {
          platform: 'amazon',
          kind: 'cheapest',
          label: '価格の安い順',
          note: '最安の出品から確認',
          url: `https://www.amazon.co.jp/s?k=${enc(name)}&s=price-asc-rank`,
        },
        {
          platform: 'amazon',
          kind: 'search',
          label: 'キーワードで通常検索',
          note: '表記ゆれを含めた広い検索',
          url: `https://www.amazon.co.jp/s?k=${enc(name)}`,
        },
      )
      break

    case 'rakuten':
      out.push(
        {
          platform: 'rakuten',
          kind: 'cheapest',
          label: '送料込みの安い順',
          note: '送料込みで価格昇順',
          url: `https://search.rakuten.co.jp/search/mall/${enc(name)}/?s=2`,
        },
        {
          platform: 'rakuten',
          kind: 'refined',
          label: '新品のみ',
          note: '新品の出品に限定',
          url: `https://search.rakuten.co.jp/search/mall/${enc(name)}/?used=0`,
        },
        {
          platform: 'rakuten',
          kind: 'refined',
          label: '人気順（売れ筋）',
          note: '売れている商品から確認',
          url: `https://search.rakuten.co.jp/search/mall/${enc(name)}/?s=12`,
        },
        {
          platform: 'rakuten',
          kind: 'search',
          label: 'キーワードで通常検索',
          note: '絞り込みなし',
          url: `https://search.rakuten.co.jp/search/mall/${enc(name)}/`,
        },
      )
      break

    case 'yahoo':
      out.push(
        {
          platform: 'yahoo',
          kind: 'cheapest',
          label: '価格の安い順',
          note: '最安の出品から確認',
          url: `https://shopping.yahoo.co.jp/search?p=${enc(name)}&sort=%2Bprice`,
        },
        {
          platform: 'yahoo',
          kind: 'refined',
          label: '新品のみ',
          note: '新品出品に限定',
          url: `https://shopping.yahoo.co.jp/search?p=${enc(name)}&used=0`,
        },
        {
          platform: 'yahoo',
          kind: 'refined',
          label: '人気順',
          note: '売れ筋順',
          url: `https://shopping.yahoo.co.jp/search?p=${enc(name)}&sort=-score2`,
        },
        {
          platform: 'yahoo',
          kind: 'search',
          label: 'キーワードで通常検索',
          note: '絞り込みなし',
          url: `https://shopping.yahoo.co.jp/search?p=${enc(name)}`,
        },
      )
      break

    case 'mercari':
      out.push(
        {
          platform: 'mercari',
          kind: 'refined',
          label: '出品中・新しい順',
          note: '今買える出品だけ',
          url: `https://jp.mercari.com/search?keyword=${enc(name)}&status=on_sale&sort=created_time&order=desc`,
        },
        {
          platform: 'mercari',
          kind: 'cheapest',
          label: '出品中・安い順',
          note: '最安の出品から確認',
          url: `https://jp.mercari.com/search?keyword=${enc(name)}&status=on_sale&sort=price&order=asc`,
        },
        {
          platform: 'mercari',
          kind: 'refined',
          label: '未使用・新品',
          note: 'コンディション=新品・未使用',
          url: `https://jp.mercari.com/search?keyword=${enc(name)}&item_condition_id[]=1&status=on_sale`,
        },
        {
          platform: 'mercari',
          kind: 'search',
          label: 'キーワードで通常検索',
          note: '絞り込みなし',
          url: `https://jp.mercari.com/search?keyword=${enc(name)}`,
        },
      )
      break

    case 'paypay':
      out.push(
        {
          platform: 'paypay',
          kind: 'cheapest',
          label: '価格の安い順',
          url: `https://paypayfleamarket.yahoo.co.jp/search/${enc(name)}?sort=price&order=asc`,
        },
        {
          platform: 'paypay',
          kind: 'search',
          label: '通常検索',
          url: `https://paypayfleamarket.yahoo.co.jp/search/${enc(name)}`,
        },
      )
      break
  }

  // ブランド絞り込みが効く場合は末尾に追加候補
  if (brand && brand.toLowerCase() !== name.toLowerCase().slice(0, brand.length)) {
    out.push({
      platform: p,
      kind: 'refined',
      label: `「${brand}」だけで検索`,
      note: 'ブランド名のみで広く探す',
      url: buildSearchUrl(p, brand),
    })
  }

  return out
}

/* =========================================================================
 * 販売候補（売値・実売相場確認）
 * ========================================================================= */

/**
 * 販売先プラットフォームでの「実売価格を確認する候補URL」一式。
 * 売り切れ済みの価格、安い順、新品コンディション等を並べる。
 */
export function buildSellCandidates(
  product: Pick<Product, 'name' | 'sellPlatform'>,
  platformOverride?: Platform,
): UrlCandidate[] {
  const p = platformOverride ?? product.sellPlatform
  const name = short(product.name)
  const out: UrlCandidate[] = []

  switch (p) {
    case 'mercari':
      out.push(
        {
          platform: 'mercari',
          kind: 'sold',
          label: '売り切れ（実売価格）',
          note: '実際に売れた金額がわかる',
          url: `https://jp.mercari.com/search?keyword=${enc(name)}&status=sold_out`,
        },
        {
          platform: 'mercari',
          kind: 'sold',
          label: '売り切れ・新品コンディション',
          note: '新品で売れた金額だけ',
          url: `https://jp.mercari.com/search?keyword=${enc(name)}&status=sold_out&item_condition_id[]=1`,
        },
        {
          platform: 'mercari',
          kind: 'refined',
          label: '出品中・安い順',
          note: '現在の最安出品を確認',
          url: `https://jp.mercari.com/search?keyword=${enc(name)}&status=on_sale&sort=price&order=asc`,
        },
        {
          platform: 'mercari',
          kind: 'newest',
          label: '出品中・新着',
          note: '最近の出品を眺める',
          url: `https://jp.mercari.com/search?keyword=${enc(name)}&status=on_sale&sort=created_time&order=desc`,
        },
      )
      break

    case 'yahoo':
      out.push(
        {
          platform: 'yahoo',
          kind: 'sold',
          label: 'ヤフオク 終了済み（落札相場）',
          note: '過去に落札された金額',
          url: `https://auctions.yahoo.co.jp/closedsearch/closedsearch?p=${enc(name)}`,
        },
        {
          platform: 'yahoo',
          kind: 'cheapest',
          label: 'ショッピング 安い順',
          note: 'Yahoo!ショッピングの最安',
          url: `https://shopping.yahoo.co.jp/search?p=${enc(name)}&sort=%2Bprice`,
        },
        {
          platform: 'yahoo',
          kind: 'refined',
          label: 'ショッピング 人気順',
          note: '売れ筋を確認',
          url: `https://shopping.yahoo.co.jp/search?p=${enc(name)}&sort=-score2`,
        },
      )
      break

    case 'rakuten':
      out.push(
        {
          platform: 'rakuten',
          kind: 'sold',
          label: '売れている順',
          note: '人気（≒実売に近い）商品順',
          url: `https://search.rakuten.co.jp/search/mall/${enc(name)}/?s=12`,
        },
        {
          platform: 'rakuten',
          kind: 'cheapest',
          label: '送料込みの安い順',
          note: '最安販売価格を確認',
          url: `https://search.rakuten.co.jp/search/mall/${enc(name)}/?s=2`,
        },
        {
          platform: 'rakuten',
          kind: 'refined',
          label: 'レビュー件数の多い順',
          note: '売れている実績',
          url: `https://search.rakuten.co.jp/search/mall/${enc(name)}/?s=14`,
        },
      )
      break

    case 'amazon':
      out.push(
        {
          platform: 'amazon',
          kind: 'refined',
          label: 'レビューが多い順',
          note: '売れている商品を確認',
          url: `https://www.amazon.co.jp/s?k=${enc(name)}&s=review-rank`,
        },
        {
          platform: 'amazon',
          kind: 'cheapest',
          label: '価格の安い順',
          note: '最安出品から確認',
          url: `https://www.amazon.co.jp/s?k=${enc(name)}&s=price-asc-rank`,
        },
        {
          platform: 'amazon',
          kind: 'newest',
          label: '新着順',
          note: '最近出品された商品',
          url: `https://www.amazon.co.jp/s?k=${enc(name)}&s=date-desc-rank`,
        },
      )
      break

    case 'paypay':
      out.push(
        {
          platform: 'paypay',
          kind: 'sold',
          label: '売り切れ・新着順',
          note: '実際に売れた金額',
          url: `https://paypayfleamarket.yahoo.co.jp/search/${enc(name)}?status=sold_out&sort=updatedAt&order=desc`,
        },
        {
          platform: 'paypay',
          kind: 'cheapest',
          label: '出品中・安い順',
          note: '現在の最安出品',
          url: `https://paypayfleamarket.yahoo.co.jp/search/${enc(name)}?sort=price&order=asc`,
        },
      )
      break
  }

  return out
}

/** シンプルな検索URL（ブランド追加候補などで使用） */
function buildSearchUrl(platform: Platform, query: string): string {
  const q = enc(query)
  switch (platform) {
    case 'amazon':  return `https://www.amazon.co.jp/s?k=${q}`
    case 'rakuten': return `https://search.rakuten.co.jp/search/mall/${q}/`
    case 'yahoo':   return `https://shopping.yahoo.co.jp/search?p=${q}`
    case 'mercari': return `https://jp.mercari.com/search?keyword=${q}`
    case 'paypay':  return `https://paypayfleamarket.yahoo.co.jp/search/${q}`
  }
}

/**
 * 最小限の候補（プロダクトが手元にない、検索クエリだけ持っている状況）を作る。
 * 店舗せどりのスキャン結果などから呼ぶ。
 */
export function buildSellCandidatesFromQuery(query: string, platform: Platform): UrlCandidate[] {
  return buildSellCandidates({ name: query, sellPlatform: platform }, platform)
}
