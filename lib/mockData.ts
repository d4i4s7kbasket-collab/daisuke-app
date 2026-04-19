import type { Product, Recommendation, SalesRecord, MarketTrend, DashboardStats, PriceBand } from './types'
import { calcCostFromBand, calcCost } from './calculations'

/**
 * 価格帯（PriceBand）ベースで商品を作る。
 * カード表示・損益試算は中央値ベースなので、実際のリンク先と
 * 多少のブレがあっても「その範囲で取れる想定」という表示に統一できる。
 */
function makeProductBand(params: {
  id: string
  name: string
  category: string
  sourcePlatform: Product['sourcePlatform']
  sellPlatform: Product['sellPlatform']
  band: PriceBand
  purchaseShipping?: number
  velocity: Product['salesVelocity']
  rank: number
  reviewCount: number
  rating: number
  imageUrl?: string
  url: string
}): Product {
  const purchaseShipping = params.purchaseShipping ?? 0
  return {
    id: params.id,
    name: params.name,
    imageUrl: params.imageUrl ?? '',
    url: params.url,
    category: params.category,
    sourcePlatform: params.sourcePlatform,
    sellPlatform: params.sellPlatform,
    cost: calcCostFromBand(params.band, params.sellPlatform, purchaseShipping),
    priceBand: params.band,
    salesVelocity: params.velocity,
    rank: params.rank,
    reviewCount: params.reviewCount,
    rating: params.rating,
    lastUpdated: new Date().toISOString(),
  }
}

// 互換: priceBand を持たない旧来の固定価格商品もまだ作れるように残す
function makeProduct(
  id: string,
  name: string,
  category: string,
  sourcePlatform: Product['sourcePlatform'],
  sellPlatform: Product['sellPlatform'],
  buyPrice: number,
  sellPrice: number,
  purchaseShipping: number,
  velocity: Product['salesVelocity'],
  rank: number,
  reviewCount: number,
  rating: number,
  imageUrl: string,
  url: string
): Product {
  return {
    id,
    name,
    imageUrl,
    url,
    category,
    sourcePlatform,
    sellPlatform,
    cost: calcCost(buyPrice, sellPrice, sellPlatform, purchaseShipping),
    salesVelocity: velocity,
    rank,
    reviewCount,
    rating,
    lastUpdated: new Date().toISOString(),
  }
}

// 実商品の参考画像（Wikimedia Commons / 公有・CCライセンス系）。
// 404の場合は ProductImage コンポーネントがカテゴリ絵文字のフォールバックを出す。
const IMG = {
  switch:   'https://upload.wikimedia.org/wikipedia/commons/thumb/8/88/Nintendo-Switch-wJoyCons-BlRd-Standing-FL.jpg/330px-Nintendo-Switch-wJoyCons-BlRd-Standing-FL.jpg',
  airpods:  'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2f/AirPods_Pro_%282nd_generation%29.jpg/330px-AirPods_Pro_%282nd_generation%29.jpg',
  pokemon:  'https://upload.wikimedia.org/wikipedia/commons/thumb/9/98/International_Pok%C3%A9mon_logo.svg/330px-International_Pok%C3%A9mon_logo.svg.png',
  lego:     'https://upload.wikimedia.org/wikipedia/commons/thumb/3/32/Lego_Color_Bricks.jpg/330px-Lego_Color_Bricks.jpg',
  dyson:    'https://upload.wikimedia.org/wikipedia/commons/thumb/4/48/Dyson_vacuum_cleaner.jpg/330px-Dyson_vacuum_cleaner.jpg',
  ps5:      'https://upload.wikimedia.org/wikipedia/commons/thumb/1/1b/PlayStation_5_and_DualSense_with_transparent_background.png/330px-PlayStation_5_and_DualSense_with_transparent_background.png',
} as const

/**
 * 商品マスタ。価格は「帯」で管理する。
 *
 * 帯の根拠メモ（2024Q4〜2025前半の国内相場ざっくり）:
 *  - 新品家電: Amazon/楽天のセール最安〜通常価格
 *  - 中古/セカンダリ: メルカリの直近売却価格 中央値±15%
 *  - 本: Bookoffの220円棚〜美品棚＋Amazonマケプレ中古「良い」「非常に良い」
 *  - 日用品: 大型店セール最安〜ネットまとめ買い単価
 */
export const MOCK_PRODUCTS: Product[] = [
  makeProductBand({
    id: 'p1',
    name: 'Nintendo Switch 本体 Joy-Con(L) ネオンブルー/(R) ネオンレッド HAC-S-KABAA',
    category: 'ゲーム',
    sourcePlatform: 'amazon', sellPlatform: 'mercari',
    band: { buyMin: 26980, buyMax: 31980, sellMin: 32000, sellMax: 36500 },
    velocity: 'high', rank: 1, reviewCount: 45213, rating: 4.6,
    imageUrl: IMG.switch,
    url: 'https://www.amazon.co.jp/s?k=Nintendo+Switch+HAC-S-KABAA',
  }),
  makeProductBand({
    id: 'p2',
    name: 'Apple AirPods Pro (第2世代) MagSafe充電ケース(USB-C)付き MTJV3J/A',
    category: '家電・オーディオ',
    sourcePlatform: 'amazon', sellPlatform: 'mercari',
    band: { buyMin: 32800, buyMax: 39800, sellMin: 31000, sellMax: 35500 },
    velocity: 'high', rank: 3, reviewCount: 89324, rating: 4.8,
    imageUrl: IMG.airpods,
    url: 'https://www.amazon.co.jp/s?k=AirPods+Pro+MTJV3J',
  }),
  makeProductBand({
    id: 'p3',
    name: 'ポケモンカードゲーム 強化拡張パック 151 BOX (シュリンク付)',
    category: 'トレカ',
    sourcePlatform: 'rakuten', sellPlatform: 'mercari',
    band: { buyMin: 5500, buyMax: 7800, sellMin: 9500, sellMax: 13500 },
    purchaseShipping: 500,
    velocity: 'high', rank: 2, reviewCount: 21045, rating: 4.9,
    imageUrl: IMG.pokemon,
    url: 'https://search.rakuten.co.jp/search/mall/%E3%83%9D%E3%82%B1%E3%83%A2%E3%83%B3+151+BOX/',
  }),
  makeProductBand({
    id: 'p4',
    name: 'LEGO テクニック 42143 フェラーリ デイトナ SP3 (廃番近接)',
    category: 'おもちゃ・ホビー',
    sourcePlatform: 'amazon', sellPlatform: 'yahoo',
    band: { buyMin: 48000, buyMax: 64800, sellMin: 78000, sellMax: 98000 },
    velocity: 'medium', rank: 12, reviewCount: 4230, rating: 4.8,
    imageUrl: IMG.lego,
    url: 'https://www.amazon.co.jp/s?k=LEGO+42143',
  }),
  makeProductBand({
    id: 'p5',
    name: 'ダイソン V12 Detect Slim Absolute SV46 コードレス掃除機',
    category: '家電',
    sourcePlatform: 'rakuten', sellPlatform: 'mercari',
    band: { buyMin: 68000, buyMax: 89800, sellMin: 78000, sellMax: 95000 },
    velocity: 'medium', rank: 8, reviewCount: 12560, rating: 4.5,
    imageUrl: IMG.dyson,
    url: 'https://search.rakuten.co.jp/search/mall/%E3%83%80%E3%82%A4%E3%82%BD%E3%83%B3+V12+SV46/',
  }),
  makeProductBand({
    id: 'p6',
    name: 'ソニー WH-1000XM5 ワイヤレスノイズキャンセリングヘッドホン WH1000XM5B',
    category: 'オーディオ',
    sourcePlatform: 'amazon', sellPlatform: 'mercari',
    band: { buyMin: 38500, buyMax: 49500, sellMin: 36000, sellMax: 44000 },
    velocity: 'medium', rank: 5, reviewCount: 56781, rating: 4.6,
    url: 'https://www.amazon.co.jp/s?k=WH-1000XM5',
  }),
  makeProductBand({
    id: 'p7',
    name: 'ワンピースカードゲーム 新時代の主役 OP-05 BOX',
    category: 'トレカ',
    sourcePlatform: 'rakuten', sellPlatform: 'mercari',
    band: { buyMin: 5800, buyMax: 8500, sellMin: 9200, sellMax: 14000 },
    purchaseShipping: 500,
    velocity: 'high', rank: 4, reviewCount: 8734, rating: 4.8,
    url: 'https://search.rakuten.co.jp/search/mall/%E3%83%AF%E3%83%B3%E3%83%94%E3%83%BC%E3%82%B9%E3%82%AB%E3%83%BC%E3%83%89+OP-05+BOX/',
  }),
  makeProductBand({
    id: 'p8',
    name: 'PlayStation 5 本体 CFI-2000A01 (ディスクドライブ搭載モデル)',
    category: 'ゲーム',
    sourcePlatform: 'amazon', sellPlatform: 'mercari',
    band: { buyMin: 66980, buyMax: 79980, sellMin: 62000, sellMax: 72000 },
    velocity: 'high', rank: 2, reviewCount: 78432, rating: 4.7,
    imageUrl: IMG.ps5,
    url: 'https://www.amazon.co.jp/s?k=PlayStation+5+CFI-2000A01',
  }),

  // ===== 本 =====
  makeProductBand({
    id: 'p9',
    name: '呪術廻戦 コミック 全26巻セット (既刊全巻 中古・良品)',
    category: '本',
    sourcePlatform: 'amazon', sellPlatform: 'mercari',
    band: { buyMin: 4500, buyMax: 8800, sellMin: 9800, sellMax: 14800 },
    velocity: 'high', rank: 6, reviewCount: 3450, rating: 4.7,
    url: 'https://www.amazon.co.jp/s?k=%E5%91%AA%E8%A1%93%E5%BB%BB%E6%88%A6+%E5%85%A8%E5%B7%BB+%E3%82%BB%E3%83%83%E3%83%88',
  }),
  makeProductBand({
    id: 'p10',
    name: '赤本 大学入試シリーズ 早稲田大学（政治経済学部）過去問 最新年度',
    category: '本',
    sourcePlatform: 'amazon', sellPlatform: 'mercari',
    band: { buyMin: 1200, buyMax: 2500, sellMin: 2400, sellMax: 3600 },
    velocity: 'medium', rank: 11, reviewCount: 620, rating: 4.4,
    url: 'https://www.amazon.co.jp/s?k=%E8%B5%A4%E6%9C%AC+%E6%97%A9%E7%A8%B2%E7%94%B0+%E6%94%BF%E7%B5%8C',
  }),
  makeProductBand({
    id: 'p11',
    name: '転職の思考法 / 北野唯我 (ビジネス書 中古)',
    category: '本',
    sourcePlatform: 'rakuten', sellPlatform: 'mercari',
    band: { buyMin: 220, buyMax: 780, sellMin: 900, sellMax: 1450 },
    purchaseShipping: 0,
    velocity: 'medium', rank: 15, reviewCount: 4120, rating: 4.5,
    url: 'https://books.rakuten.co.jp/search?sitem=%E8%BB%A2%E8%81%B7%E3%81%AE%E6%80%9D%E8%80%83%E6%B3%95',
  }),

  // ===== 日用品 =====
  makeProductBand({
    id: 'p12',
    name: 'アタックZERO 洗濯洗剤 超特大サイズ 3袋まとめ売り（業務用）',
    category: '日用品',
    sourcePlatform: 'amazon', sellPlatform: 'amazon',
    band: { buyMin: 2180, buyMax: 3280, sellMin: 3980, sellMax: 4780 },
    velocity: 'high', rank: 9, reviewCount: 15420, rating: 4.6,
    url: 'https://www.amazon.co.jp/s?k=%E3%82%A2%E3%82%BF%E3%83%83%E3%82%AFZERO+%E8%A9%B0%E6%9B%BF%E3%81%88+3%E8%A2%8B',
  }),
  makeProductBand({
    id: 'p13',
    name: 'SK-II フェイシャルトリートメントエッセンス 230mL （新品・本物）',
    category: '日用品',
    sourcePlatform: 'rakuten', sellPlatform: 'mercari',
    band: { buyMin: 18800, buyMax: 24800, sellMin: 22500, sellMax: 28500 },
    velocity: 'medium', rank: 14, reviewCount: 8920, rating: 4.7,
    url: 'https://search.rakuten.co.jp/search/mall/SK-II+%E3%83%95%E3%82%A7%E3%82%A4%E3%82%B7%E3%83%A3%E3%83%AB+230mL/',
  }),
  makeProductBand({
    id: 'p14',
    name: 'プロテイン ホエイ アルプロン WPC 3kg チョコ（賞味期限内）',
    category: '日用品',
    sourcePlatform: 'rakuten', sellPlatform: 'amazon',
    band: { buyMin: 6980, buyMax: 8980, sellMin: 9800, sellMax: 12800 },
    velocity: 'medium', rank: 18, reviewCount: 23450, rating: 4.4,
    url: 'https://search.rakuten.co.jp/search/mall/%E3%82%A2%E3%83%AB%E3%83%97%E3%83%AD%E3%83%B3+WPC+3kg/',
  }),
]

export const MOCK_RECOMMENDATIONS: Recommendation[] = [
  // ===== 初心者向け (easy) =====
  {
    id: 'r-easy-1',
    product: MOCK_PRODUCTS[10], // p11: 転職の思考法（中古本）
    reason:
      'Bookoff の220〜500円棚で定期的に見つかるビジネス書。メルカリでは「帯付き・美品」で900〜1,450円で回転する。1冊あたり400〜800円の安定薄利だが、見つけたら必ず取れる再現性が魅力。',
    confidence: 92,
    estimatedMonthlySales: 15,
    buyQuantity: 10,
    status: 'pending',
    createdAt: new Date().toISOString(),
    difficulty: 'easy',
    findHint:
      'Bookoffのビジネス書220〜500円棚で「転職」「キャリア」の定番タイトルを探す。帯・カバーありが高く売れる。Kindle化されていても紙本の需要は残っている。',
    risks: [
      '日焼け・書き込みがあると値崩れする（要検品）',
      '送料込みだと利幅が縮むのでネコポス(¥210)で発送すること',
      '同タイトルが一気に流れると相場が1〜2週間下がる',
    ],
    timeHorizon: 'short',
  },
  {
    id: 'r-easy-2',
    product: MOCK_PRODUCTS[8], // p9: 呪術廻戦 全巻
    reason:
      'アニメ完結で「いま揃えたい層」が増加。Bookoffの全巻セット中古なら4,500〜8,800円、Amazonマケプレで9,800〜14,800円が狙える定番。新品価格より割安で揃うので需要が安定。',
    confidence: 88,
    estimatedMonthlySales: 6,
    buyQuantity: 3,
    status: 'pending',
    createdAt: new Date().toISOString(),
    difficulty: 'easy',
    findHint:
      'Bookoff Super Bazaarの「全巻セット」コーナー、または各巻を250円棚で集めて自前でセット化する。Amazon出品はFBA推奨、メルカリは「匿名配送＋らくらくメルカリ便 160サイズ」で全国1,600円弱。',
    risks: [
      '最終巻が欠けていることがある（必ず冊数と巻数を確認）',
      'タバコ臭・日焼けは即クレーム対象',
      '同時期に似た出品が増えると価格が下がるので見切り発車しない',
    ],
    timeHorizon: 'medium',
  },
  {
    id: 'r-easy-3',
    product: MOCK_PRODUCTS[11], // p12: 洗剤まとめ買い
    reason:
      'ドラッグストア／コストコ／特売日に詰替3袋を2,180〜2,680円で仕入れ、Amazonで3,980〜4,780円。Amazon本体が品薄になる時期は4,500円超えが続きやすく、日用品は返品リスクも極小。',
    confidence: 85,
    estimatedMonthlySales: 20,
    buyQuantity: 8,
    status: 'pending',
    createdAt: new Date().toISOString(),
    difficulty: 'easy',
    findHint:
      'Amazonの「Keepa」グラフで本家が在庫切れになるタイミングを狙う。実店舗ではクリエイト／ウエルシアの週末特価、コストコの大袋を要チェック。',
    risks: [
      '食品・日用品は「日本製」「新品」「証明写真」をAmazonに提出要求される場合がある',
      'FBAの在庫保管料が発生するので長期在庫はNG',
      '同一セラー多数で相場崩れしやすい → 300円以上下がったら深追いしない',
    ],
    timeHorizon: 'short',
  },

  // ===== バランス (normal) =====
  {
    id: 'r-norm-1',
    product: MOCK_PRODUCTS[2], // p3: ポケモン151 BOX
    reason:
      '生産調整の影響で品薄が続き、メルカリでは定価5,500円に対し9,500〜13,500円で推移。シングルカード需要も高く、BOX開封後のパック単位出品でも黒字化しやすい。',
    confidence: 90,
    estimatedMonthlySales: 10,
    buyQuantity: 5,
    status: 'pending',
    createdAt: new Date().toISOString(),
    difficulty: 'normal',
    findHint:
      '楽天スーパーセール・5と0のつく日でポイント込み実質6,000円前後を狙う。シュリンク付が必須条件、シュリンク無しは一気に2,000円以上下がる。',
    risks: [
      'シュリンク無し・再シュリンク品が出回るので仕入れ時要確認',
      '発送は「らくらくメルカリ便ネコポス」不可（厚み超）→ ゆうパケットプラス推奨',
      '再販アナウンスが出ると相場が1〜2週間で20〜30%下落',
    ],
    timeHorizon: 'short',
  },
  {
    id: 'r-norm-2',
    product: MOCK_PRODUCTS[13], // p14: プロテイン
    reason:
      '楽天マラソン時のアルプロン公式で3kgを6,980〜7,980円。Amazonでは9,800〜12,800円で回転、とくに1月・4月・9月の新規ジム客需要期は上振れしやすい。',
    confidence: 82,
    estimatedMonthlySales: 12,
    buyQuantity: 6,
    status: 'pending',
    createdAt: new Date().toISOString(),
    difficulty: 'normal',
    findHint:
      '楽天お買い物マラソン初日＋ポイント10倍以上の組み合わせを狙う。賞味期限1年以上あるロットのみ仕入れる（期限切迫品はAmazon規約NG）。',
    risks: [
      'Amazon食品カテゴリは出品許可申請が必要な場合あり',
      '高温時期の配送で品質クレームが出やすい → 夏は冷蔵/速達オプション検討',
      'メーカー公式セール直後は相場が一時下落',
    ],
    timeHorizon: 'medium',
  },
  {
    id: 'r-norm-3',
    product: MOCK_PRODUCTS[0], // p1: Nintendo Switch
    reason:
      '後継機発売観測で初代Switchの駆け込み需要が継続。Amazon新品が26,980〜31,980円で推移する一方、メルカリ中古美品は32,000〜36,500円で安定。送料と手数料込みでも1台あたり2,000〜4,000円の利益帯。',
    confidence: 78,
    estimatedMonthlySales: 4,
    buyQuantity: 2,
    status: 'pending',
    createdAt: new Date().toISOString(),
    difficulty: 'normal',
    findHint:
      '家電量販店の下取りセール・Amazonのタイムセールで新品定価以下を狙う。中古仕入れなら「箱・付属品すべて揃い」「本体シリアル判読可」が必須。',
    risks: [
      '後継機の正式発表が出ると即日10〜15%下落する可能性',
      '中古品は初期化と充電劣化チェックが必須',
      '年始・GW明けは供給が一気に増えて相場が下がる',
    ],
    timeHorizon: 'short',
  },

  // ===== 上級向け (hard) =====
  {
    id: 'r-hard-1',
    product: MOCK_PRODUCTS[3], // p4: LEGO 廃番近接
    reason:
      'LEGOテクニックの大型セットは廃番後に1.5〜2倍まで上昇する実績。42143デイトナSP3はまもなく廃番観測で、現行価格48,000〜64,800円で仕入れられれば1年後78,000〜98,000円の帯が狙える。',
    confidence: 74,
    estimatedMonthlySales: 1,
    buyQuantity: 2,
    status: 'pending',
    createdAt: new Date().toISOString(),
    difficulty: 'hard',
    findHint:
      'LEGO公式のセール＋LEGO VIPポイントを併用。Amazonアウトレット「ほぼ新品」も狙い目。廃番タイミングはBrickLink・BrickEconomyで観測する。',
    risks: [
      '資金拘束期間が長い（3ヶ月〜1年）',
      '箱つぶれ・日焼けがあると大きく減額',
      '廃番観測が外れると塩漬け在庫になる',
    ],
    timeHorizon: 'long',
  },
  {
    id: 'r-hard-2',
    product: MOCK_PRODUCTS[12], // p13: SK-II
    reason:
      '化粧品は利幅が大きい反面、偽物・並行輸入・期限切迫のリスクが高い。楽天の正規代理店＋SPU高還元で18,800円前後を安定的に作れれば、メルカリで22,500〜28,500円の帯に乗る。',
    confidence: 70,
    estimatedMonthlySales: 3,
    buyQuantity: 2,
    status: 'pending',
    createdAt: new Date().toISOString(),
    difficulty: 'hard',
    findHint:
      '楽天の「P&Gビューティショップ」など正規販売店のみを使う。個人出品・怪しい免税店ルートは仕入れない。バッチ番号で製造時期を確認。',
    risks: [
      '偽物・詰め替え疑惑のクレームが最も多いカテゴリ',
      '化粧品はプラットフォーム規約で出品制限あり（Amazon要申請）',
      '箱無し・開封済みは相場が半値近くまで落ちる',
    ],
    timeHorizon: 'medium',
  },
]

export const MOCK_SALES: SalesRecord[] = [
  {
    id: 's1',
    productName: 'ポケモンカード 151 BOX',
    category: 'トレカ',
    buyPrice: 5500,
    sellPrice: 9200,
    quantity: 3,
    profit: 9240,
    profitRate: 56.0,
    platform: 'mercari',
    soldAt: new Date(Date.now() - 2 * 86400000).toISOString(),
  },
  {
    id: 's2',
    productName: 'Nintendo Switch Joy-Con ネオン',
    category: 'ゲーム',
    buyPrice: 28500,
    sellPrice: 36000,
    quantity: 1,
    profit: 3430,
    profitRate: 12.0,
    platform: 'mercari',
    soldAt: new Date(Date.now() - 3 * 86400000).toISOString(),
  },
  {
    id: 's3',
    productName: 'LEGO テクニック 42151',
    category: 'おもちゃ',
    buyPrice: 15800,
    sellPrice: 21500,
    quantity: 2,
    profit: 7240,
    profitRate: 22.9,
    platform: 'yahoo',
    soldAt: new Date(Date.now() - 5 * 86400000).toISOString(),
  },
  {
    id: 's4',
    productName: 'AirPods Pro 第2世代',
    category: '家電',
    buyPrice: 28000,
    sellPrice: 34500,
    quantity: 1,
    profit: 2950,
    profitRate: 10.5,
    platform: 'mercari',
    soldAt: new Date(Date.now() - 7 * 86400000).toISOString(),
  },
  {
    id: 's5',
    productName: 'ワンピースカード 頂上決戦 BOX',
    category: 'トレカ',
    buyPrice: 4500,
    sellPrice: 8500,
    quantity: 4,
    profit: 13800,
    profitRate: 76.7,
    platform: 'mercari',
    soldAt: new Date(Date.now() - 10 * 86400000).toISOString(),
  },
  {
    id: 's6',
    productName: '転職の思考法（中古本）',
    category: '本',
    buyPrice: 280,
    sellPrice: 1180,
    quantity: 12,
    profit: 6960,
    profitRate: 207,
    platform: 'mercari',
    soldAt: new Date(Date.now() - 6 * 86400000).toISOString(),
  },
  {
    id: 's7',
    productName: 'アタックZERO 詰替3袋',
    category: '日用品',
    buyPrice: 2380,
    sellPrice: 4280,
    quantity: 5,
    profit: 6250,
    profitRate: 52.5,
    platform: 'amazon',
    soldAt: new Date(Date.now() - 8 * 86400000).toISOString(),
  },
]

export const MOCK_TRENDS: MarketTrend[] = [
  {
    category: '本・漫画全巻セット',
    trend: 'rising',
    avgProfitRate: 180.0,
    competitionLevel: 'low',
    recommendedBrands: ['呪術廻戦', 'ワンピース', 'SPY×FAMILY', '赤本'],
    insight: 'Bookoffの220〜500円棚を起点に、メルカリで「全巻セット」「美品」需要が継続。資金が小さく始められ、再現性が最も高いカテゴリ。',
  },
  {
    category: '日用品・消耗品',
    trend: 'stable',
    avgProfitRate: 45.0,
    competitionLevel: 'medium',
    recommendedBrands: ['アタック', 'SK-II', 'アルプロン', 'P&G'],
    insight: '返品率が低く在庫評価損が出にくい安定カテゴリ。Amazon本体の在庫切れタイミングを狙えば40〜60%利益率も可能。ただし食品・化粧品は出品許可が必要なことがある。',
  },
  {
    category: 'トレカ・カードゲーム',
    trend: 'rising',
    avgProfitRate: 48.5,
    competitionLevel: 'medium',
    recommendedBrands: ['ポケモン', '遊戯王', 'ワンピース'],
    insight: '限定版や新弾発売直後に需要集中。BOX単位での仕入れが効率的。二次流通価格は定価の1.5〜3倍になることも。',
  },
  {
    category: 'ゲーム機・周辺機器',
    trend: 'stable',
    avgProfitRate: 12.8,
    competitionLevel: 'high',
    recommendedBrands: ['Nintendo', 'Sony PlayStation'],
    insight: '新作発売前後・年末に価格上昇。品薄情報をいち早くキャッチすることが重要。利益率は低めだが安定した需要がある。',
  },
  {
    category: 'LEGO・プラモデル',
    trend: 'rising',
    avgProfitRate: 28.4,
    competitionLevel: 'low',
    recommendedBrands: ['LEGO テクニック', 'バンダイ ガンプラ'],
    insight: '廃番後に価格が上昇するパターンが多い。テクニックシリーズの需要が急上昇中。競合が少なく穴場カテゴリ。',
  },
  {
    category: '高級家電・AV機器',
    trend: 'stable',
    avgProfitRate: 10.5,
    competitionLevel: 'medium',
    recommendedBrands: ['ダイソン', 'Apple', 'ソニー'],
    insight: 'セール品・ポイント還元を活用すると実質利益率が向上。楽天スーパーセール時の仕入れが特に有効。',
  },
]

export const MOCK_DASHBOARD: DashboardStats = {
  totalRevenue: 1245800,
  totalProfit: 187320,
  profitRate: 15.0,
  totalItems: 47,
  pendingApprovals: 3,
  monthlyRevenue: [
    { month: '10月', revenue: 180000, profit: 27000, items: 6 },
    { month: '11月', revenue: 210000, profit: 34000, items: 8 },
    { month: '12月', revenue: 380000, profit: 62000, items: 14 },
    { month: '1月', revenue: 145000, profit: 21000, items: 5 },
    { month: '2月', revenue: 168000, profit: 24000, items: 7 },
    { month: '3月', revenue: 162800, profit: 19320, items: 7 },
  ],
  categoryBreakdown: [
    { category: 'トレカ', revenue: 420000, profit: 85000, count: 18 },
    { category: 'ゲーム', revenue: 310000, profit: 39600, count: 12 },
    { category: '本', revenue: 120000, profit: 58000, count: 48 },
    { category: '日用品', revenue: 195800, profit: 72320, count: 32 },
  ],
}

// 未使用だが外部参照される可能性のあるヘルパも輸出
export { makeProduct }
