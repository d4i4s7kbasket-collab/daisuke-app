import type { StoreDeal, StoreType, Platform } from './types'

/** 店舗タイプのラベル */
export const STORE_LABELS: Record<StoreType, string> = {
  bookoff: 'ブックオフ',
  hardoff: 'ハードオフ',
  donki: 'ドンキホーテ',
  yamada: 'ヤマダ電機',
  bic: 'ビック・ヨドバシ',
  toysrus: 'トイザらス',
  geo: 'GEO',
  recycle: 'リサイクルショップ',
  super: 'スーパー・ドラッグ',
  outlet: 'アウトレット',
}

/** 店舗タイプの色（バッジ用） */
export const STORE_COLORS: Record<StoreType, string> = {
  bookoff: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  hardoff: 'bg-orange-100 text-orange-700 border-orange-200',
  donki: 'bg-pink-100 text-pink-700 border-pink-200',
  yamada: 'bg-red-100 text-red-700 border-red-200',
  bic: 'bg-blue-100 text-blue-700 border-blue-200',
  toysrus: 'bg-sky-100 text-sky-700 border-sky-200',
  geo: 'bg-indigo-100 text-indigo-700 border-indigo-200',
  recycle: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  super: 'bg-teal-100 text-teal-700 border-teal-200',
  outlet: 'bg-purple-100 text-purple-700 border-purple-200',
}

export const DIFFICULTY_LABELS = {
  easy: { label: 'よく見つかる', color: 'bg-emerald-50 text-emerald-700' },
  normal: { label: 'たまに見つかる', color: 'bg-amber-50 text-amber-700' },
  hard: { label: '稀にある', color: 'bg-rose-50 text-rose-700' },
} as const

/**
 * 店舗で見つかる可能性が高く、かつプラットフォーム販売で利益が出やすい商品のモック。
 * 実運用では Keepa / 外部相場API から動的に生成する想定。
 */
export const STORE_DEALS: StoreDeal[] = [
  {
    id: 'sd1',
    name: 'レトロゲーム ソフト（スーパーファミコン・ゲームボーイ系）',
    category: 'レトロゲーム',
    stores: ['bookoff', 'hardoff', 'recycle', 'geo'],
    inStorePriceRange: [100, 2000],
    bestSellPlatform: 'mercari',
    sellPriceRange: [800, 8000],
    estimatedProfit: 2500,
    hint: 'ジャンクコーナー・100円コーナーを確認。箱説付きはさらに高値。',
    difficulty: 'easy',
    keywords: ['スーパーファミコン', 'ゲームボーイ', 'PS2', 'レア', '箱説付き'],
  },
  {
    id: 'sd2',
    name: 'ポケモンカード 旧裏・プロモ・引退品',
    category: 'トレカ',
    stores: ['bookoff', 'hardoff', 'recycle'],
    inStorePriceRange: [100, 3000],
    bestSellPlatform: 'mercari',
    sellPriceRange: [1500, 20000],
    estimatedProfit: 4200,
    hint: 'ショーケース内のカード・100円コーナーを要確認。ガラスケースの値付けミスが狙い目。',
    difficulty: 'hard',
    keywords: ['ポケカ', '旧裏', 'プロモ', '初版', 'リザードン'],
  },
  {
    id: 'sd3',
    name: 'ゲーム機本体（旧世代・周辺機器付き）',
    category: 'ゲーム機',
    stores: ['hardoff', 'geo', 'recycle', 'bookoff'],
    inStorePriceRange: [2000, 15000],
    bestSellPlatform: 'mercari',
    sellPriceRange: [5000, 28000],
    estimatedProfit: 6500,
    hint: '動作未確認・ジャンク品に注意。純正品・付属品完備のものを。',
    difficulty: 'normal',
    keywords: ['Wii', 'PS3', 'PS2', '3DS', 'Vita'],
  },
  {
    id: 'sd4',
    name: 'LEGO 廃番・旧製品',
    category: 'おもちゃ',
    stores: ['toysrus', 'outlet', 'donki', 'recycle'],
    inStorePriceRange: [3000, 12000],
    bestSellPlatform: 'yahoo',
    sellPriceRange: [8000, 30000],
    estimatedProfit: 5800,
    hint: 'クリアランス・アウトレット棚を重点的に。テクニック・スターウォーズ系は高騰しやすい。',
    difficulty: 'normal',
    keywords: ['LEGO', 'テクニック', 'スターウォーズ', '廃番'],
  },
  {
    id: 'sd5',
    name: '食玩・フィギュア（プライズ品含む）',
    category: 'フィギュア',
    stores: ['donki', 'bookoff', 'recycle'],
    inStorePriceRange: [300, 3000],
    bestSellPlatform: 'mercari',
    sellPriceRange: [1500, 8000],
    estimatedProfit: 1800,
    hint: 'クレーンゲーム景品やワゴンセールが狙い目。シリーズ完品はさらに高値。',
    difficulty: 'easy',
    keywords: ['フィギュア', 'プライズ', 'ワンピース', 'ドラゴンボール'],
  },
  {
    id: 'sd6',
    name: 'Switch ソフト（廃版・限定版・初回特典版）',
    category: 'ゲームソフト',
    stores: ['geo', 'bookoff', 'recycle'],
    inStorePriceRange: [1500, 4500],
    bestSellPlatform: 'mercari',
    sellPriceRange: [3000, 9000],
    estimatedProfit: 2200,
    hint: '中古ワゴンを要チェック。アトラス・スパイク系は限定版が高騰。',
    difficulty: 'normal',
    keywords: ['Switch', '限定版', 'ペルソナ', 'ゼルダ'],
  },
  {
    id: 'sd7',
    name: 'Apple 旧世代製品（iPod・AirPods 等）',
    category: '家電・オーディオ',
    stores: ['hardoff', 'bic', 'yamada', 'recycle'],
    inStorePriceRange: [3000, 15000],
    bestSellPlatform: 'mercari',
    sellPriceRange: [6000, 25000],
    estimatedProfit: 4500,
    hint: '中古コーナー・展示品処分。付属品・箱の有無で価格が変動。',
    difficulty: 'normal',
    keywords: ['iPod', 'AirPods', '第2世代', 'Apple Watch'],
  },
  {
    id: 'sd8',
    name: 'ブランド食器・未使用贈答品',
    category: '食器・キッチン',
    stores: ['bookoff', 'recycle', 'outlet'],
    inStorePriceRange: [500, 3000],
    bestSellPlatform: 'mercari',
    sellPriceRange: [2500, 10000],
    estimatedProfit: 2800,
    hint: 'ノリタケ・ウェッジウッド・バカラなどのブランドを。箱入り贈答品が狙い目。',
    difficulty: 'easy',
    keywords: ['ノリタケ', 'ウェッジウッド', 'バカラ', '贈答品'],
  },
  {
    id: 'sd9',
    name: '化粧品・コスメ（廃版・限定品）',
    category: 'コスメ',
    stores: ['donki', 'super', 'outlet'],
    inStorePriceRange: [500, 3000],
    bestSellPlatform: 'mercari',
    sellPriceRange: [1500, 6000],
    estimatedProfit: 1400,
    hint: 'ドンキ限定価格・廃番コーナー。SK-II・資生堂などの限定パッケージ。',
    difficulty: 'normal',
    keywords: ['SK-II', '資生堂', 'ディオール', '限定'],
  },
  {
    id: 'sd10',
    name: '書籍・コミック（全巻セット・絶版）',
    category: '書籍',
    stores: ['bookoff'],
    inStorePriceRange: [500, 5000],
    bestSellPlatform: 'mercari',
    sellPriceRange: [2000, 15000],
    estimatedProfit: 3100,
    hint: '100円コーナー・110円均一。ビジネス書・専門書・絶版コミックが狙い目。',
    difficulty: 'easy',
    keywords: ['全巻セット', '専門書', '絶版', '初版'],
  },
]

/** 店舗別にフィルタ */
export function dealsByStore(deals: StoreDeal[], store: StoreType): StoreDeal[] {
  return deals.filter((d) => d.stores.includes(store))
}

/**
 * 店舗価格・商品名からプラットフォーム比較クオートを生成する（簡易版）。
 * 実運用では Keepa / メルカリAPI から実売相場を取得して置き換える。
 *
 * ここでは「店頭価格を仕入れとみなして」プラットフォーム手数料・送料を差し引き、
 * 固定の想定販売倍率（カテゴリ・キーワード推定）で相場を見積もる。
 */
export function estimateQuoteSet(params: {
  query: string
  inStorePrice: number
}): { platform: Platform; estimatedSellPrice: number; confidence: 'high' | 'medium' | 'low'; note?: string }[] {
  const { query, inStorePrice } = params
  const q = query.toLowerCase()

  // カテゴリ推定
  let mercariMult = 1.8
  let amazonMult = 2.1
  let rakutenMult = 1.9
  let yahooMult = 1.7
  let confidence: 'high' | 'medium' | 'low' = 'medium'
  let note = '実相場はリンク先で必ず確認してください'

  if (/ポケ|pokemon|ポケカ|カード|トレカ|遊戯王/.test(q)) {
    mercariMult = 2.5; amazonMult = 2.0; rakutenMult = 2.2; yahooMult = 2.8
    confidence = 'high'
    note = 'トレカは売り切れ相場で確認必須'
  } else if (/lego|レゴ/.test(q)) {
    mercariMult = 1.6; amazonMult = 1.5; rakutenMult = 1.5; yahooMult = 2.1
    confidence = 'high'
    note = '廃番品はヤフオクが高値になりやすい'
  } else if (/switch|ps5|ps4|ゲーム|nintendo/.test(q)) {
    mercariMult = 1.4; amazonMult = 1.3; rakutenMult = 1.3; yahooMult = 1.4
    confidence = 'high'
  } else if (/iphone|ipad|apple|airpods/.test(q)) {
    mercariMult = 1.5; amazonMult = 1.4; rakutenMult = 1.4; yahooMult = 1.5
    confidence = 'high'
  } else if (/本|書籍|コミック|漫画/.test(q)) {
    mercariMult = 2.8; amazonMult = 2.2; rakutenMult = 1.8; yahooMult = 1.6
    confidence = 'medium'
  } else {
    confidence = 'low'
  }

  return [
    { platform: 'mercari' as Platform, estimatedSellPrice: Math.round(inStorePrice * mercariMult), confidence, note },
    { platform: 'amazon' as Platform, estimatedSellPrice: Math.round(inStorePrice * amazonMult), confidence, note },
    { platform: 'rakuten' as Platform, estimatedSellPrice: Math.round(inStorePrice * rakutenMult), confidence, note },
    { platform: 'yahoo' as Platform, estimatedSellPrice: Math.round(inStorePrice * yahooMult), confidence, note },
  ]
}
