import type { Product, Platform, ListingTemplate } from './types'

/**
 * 各プラットフォーム向けの出品文面テンプレートを生成する。
 * 商品確認ダイアログとインベントリ画面から呼ばれる。
 */

function cleanName(name: string): string {
  // 楽天系によくある記号除去
  return name.replace(/【[^】]*】/g, '').replace(/\s{2,}/g, ' ').trim()
}

function mercari(p: Product): ListingTemplate {
  const title = cleanName(p.name).slice(0, 40)
  const description = [
    `◆ ${cleanName(p.name)}`,
    '',
    '【商品の状態】新品・未使用',
    '【発送方法】らくらくメルカリ便（匿名配送）',
    '【発送までの日数】1〜2日',
    '',
    '・正規品です。新品未開封の状態でお届けします。',
    '・土日祝も発送可能です。コメント不要・即購入OK。',
    '・すり替え防止のため、返品はご遠慮ください。',
    '',
    'ご不明点はコメント欄よりお問い合わせください。',
  ].join('\n')

  return {
    platform: 'mercari',
    title,
    description,
    price: p.cost.sellPrice,
    tags: tagsFor(p),
    shippingMethod: 'らくらくメルカリ便',
  }
}

function yahoo(p: Product): ListingTemplate {
  const title = cleanName(p.name).slice(0, 65)
  const description = [
    `【商品名】${cleanName(p.name)}`,
    '',
    '【商品の状態】新品・未使用',
    '【配送方法】ヤマト運輸 宅急便（追跡あり・補償あり）',
    '【発送元】日本国内',
    '',
    '正規ルートで仕入れた新品未開封商品です。',
    '丁寧に梱包してお届けします。',
    '土日祝を除き、ご入金確認後1〜2営業日以内に発送いたします。',
    '',
    '【注意事項】',
    '・ノークレーム・ノーリターンにてお願いいたします。',
    '・初期不良はメーカー保証にて対応をお願いいたします。',
  ].join('\n')

  return {
    platform: 'yahoo',
    title,
    description,
    price: p.cost.sellPrice,
    tags: tagsFor(p),
    shippingMethod: 'ヤマト運輸 宅急便',
  }
}

function rakuten(p: Product): ListingTemplate {
  const title = cleanName(p.name).slice(0, 127)
  const description = [
    '━━━━━━━━━━━━━━━━━━━━',
    `■ 商品名：${cleanName(p.name)}`,
    '━━━━━━━━━━━━━━━━━━━━',
    '',
    '【商品仕様】',
    `・カテゴリ：${p.category}`,
    '・状態：新品・未開封',
    '・保証：メーカー保証',
    '',
    '【配送について】',
    '・ヤマト運輸にて追跡番号付きで発送いたします。',
    '・平日13時までのご注文は当日発送いたします。',
    '',
    '【ご購入前に必ずお読みください】',
    'ご注文後のキャンセル・返品・交換はお受けできません。',
    '予めご了承の上、ご注文くださいませ。',
  ].join('\n')

  return {
    platform: 'rakuten',
    title,
    description,
    price: p.cost.sellPrice,
    tags: tagsFor(p),
    shippingMethod: 'ヤマト運輸',
  }
}

function amazon(p: Product): ListingTemplate {
  const title = cleanName(p.name).slice(0, 200)
  const description = [
    `${cleanName(p.name)}`,
    '',
    '【状態】新品・未使用・未開封',
    '【発送】FBA または自社発送（追跡番号あり）',
    '',
    '・正規品を丁寧に検品の上、発送いたします。',
    '・万が一の初期不良時も迅速に対応いたします。',
  ].join('\n')

  return {
    platform: 'amazon',
    title,
    description,
    price: p.cost.sellPrice,
    tags: tagsFor(p),
    shippingMethod: 'FBA / 宅急便',
  }
}

function paypay(p: Product): ListingTemplate {
  const title = cleanName(p.name).slice(0, 30)
  const description = [
    `${cleanName(p.name)}`,
    '',
    '◆新品・未開封◆',
    '◆匿名配送（ヤフネコ！パック）◆',
    '◆即購入OK / 値下げ相談可◆',
    '',
    '丁寧に梱包して1〜2日以内に発送します。',
    'よろしくお願いいたします。',
  ].join('\n')

  return {
    platform: 'paypay',
    title,
    description,
    price: p.cost.sellPrice,
    tags: tagsFor(p),
    shippingMethod: 'ヤフネコ！パック',
  }
}

function tagsFor(p: Product): string[] {
  const words = cleanName(p.name).split(/[\s　・\/]/).filter((w) => w.length >= 2).slice(0, 6)
  return Array.from(new Set([p.category, ...words]))
}

const GENERATORS: Record<Platform, (p: Product) => ListingTemplate> = {
  mercari,
  yahoo,
  rakuten,
  amazon,
  paypay,
}

export function generateTemplate(product: Product, platform: Platform): ListingTemplate {
  return GENERATORS[platform](product)
}

export function generateAllTemplates(product: Product): ListingTemplate[] {
  return (Object.keys(GENERATORS) as Platform[]).map((pl) => GENERATORS[pl](product))
}
