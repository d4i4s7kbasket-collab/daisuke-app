// ヤマト運輸 宅急便 60サイズ（2kg以内）の配送料（税込）
// 発送元都道府県 → 着地帯域ごとの料金

export const PREFECTURES = [
  '北海道', '青森', '岩手', '宮城', '秋田', '山形', '福島',
  '茨城', '栃木', '群馬', '埼玉', '千葉', '東京', '神奈川',
  '新潟', '富山', '石川', '福井', '山梨', '長野', '岐阜',
  '静岡', '愛知', '三重', '滋賀', '京都', '大阪', '兵庫',
  '奈良', '和歌山', '鳥取', '島根', '岡山', '広島', '山口',
  '徳島', '香川', '愛媛', '高知', '福岡', '佐賀', '長崎',
  '熊本', '大分', '宮崎', '鹿児島', '沖縄',
] as const

export type Prefecture = typeof PREFECTURES[number]

type Zone = 'hokkaido' | 'tohoku' | 'kanto' | 'chubu' | 'kansai' | 'chugoku' | 'shikoku' | 'kyushu' | 'okinawa'

const PREFECTURE_ZONE: Record<Prefecture, Zone> = {
  '北海道': 'hokkaido',
  '青森': 'tohoku', '岩手': 'tohoku', '宮城': 'tohoku', '秋田': 'tohoku', '山形': 'tohoku', '福島': 'tohoku',
  '茨城': 'kanto', '栃木': 'kanto', '群馬': 'kanto', '埼玉': 'kanto', '千葉': 'kanto', '東京': 'kanto', '神奈川': 'kanto',
  '新潟': 'chubu', '富山': 'chubu', '石川': 'chubu', '福井': 'chubu', '山梨': 'chubu', '長野': 'chubu',
  '岐阜': 'chubu', '静岡': 'chubu', '愛知': 'chubu', '三重': 'chubu',
  '滋賀': 'kansai', '京都': 'kansai', '大阪': 'kansai', '兵庫': 'kansai', '奈良': 'kansai', '和歌山': 'kansai',
  '鳥取': 'chugoku', '島根': 'chugoku', '岡山': 'chugoku', '広島': 'chugoku', '山口': 'chugoku',
  '徳島': 'shikoku', '香川': 'shikoku', '愛媛': 'shikoku', '高知': 'shikoku',
  '福岡': 'kyushu', '佐賀': 'kyushu', '長崎': 'kyushu', '熊本': 'kyushu', '大分': 'kyushu', '宮崎': 'kyushu', '鹿児島': 'kyushu',
  '沖縄': 'okinawa',
}

// 発送元ゾーン × 着地帯域 → 料金（60サイズ、税込）
const SHIPPING_TABLE: Record<Zone, Record<Zone, number>> = {
  hokkaido: { hokkaido: 930, tohoku: 1150, kanto: 1270, chubu: 1270, kansai: 1390, chugoku: 1390, shikoku: 1390, kyushu: 1510, okinawa: 1730 },
  tohoku:   { hokkaido: 1150, tohoku: 930, kanto: 1060, chubu: 1060, kansai: 1170, chugoku: 1280, shikoku: 1280, kyushu: 1390, okinawa: 1620 },
  kanto:    { hokkaido: 1270, tohoku: 1060, kanto: 930, chubu: 930, kansai: 1060, chugoku: 1170, shikoku: 1170, kyushu: 1280, okinawa: 1620 },
  chubu:    { hokkaido: 1270, tohoku: 1060, kanto: 930, chubu: 930, kansai: 930, chugoku: 1060, shikoku: 1060, kyushu: 1170, okinawa: 1510 },
  kansai:   { hokkaido: 1390, tohoku: 1170, kanto: 1060, chubu: 930, kansai: 930, chugoku: 930, shikoku: 930, kyushu: 1060, okinawa: 1390 },
  chugoku:  { hokkaido: 1390, tohoku: 1280, kanto: 1170, chubu: 1060, kansai: 930, chugoku: 930, shikoku: 930, kyushu: 930, okinawa: 1280 },
  shikoku:  { hokkaido: 1390, tohoku: 1280, kanto: 1170, chubu: 1060, kansai: 930, chugoku: 930, shikoku: 930, kyushu: 930, okinawa: 1280 },
  kyushu:   { hokkaido: 1510, tohoku: 1390, kanto: 1280, chubu: 1170, kansai: 1060, chugoku: 930, shikoku: 930, kyushu: 930, okinawa: 1170 },
  okinawa:  { hokkaido: 1730, tohoku: 1620, kanto: 1620, chubu: 1510, kansai: 1390, chugoku: 1280, shikoku: 1280, kyushu: 1170, okinawa: 930 },
}

// 発送元都道府県と着地都道府県から配送料を取得
export function getShippingCost(fromPref: Prefecture, toPref?: Prefecture): number {
  const fromZone = PREFECTURE_ZONE[fromPref]
  // 着地不明の場合は全国平均（関東向け想定）
  const toZone = toPref ? PREFECTURE_ZONE[toPref] : 'kanto'
  return SHIPPING_TABLE[fromZone]?.[toZone] ?? 930
}

// 発送元都道府県の平均配送料（全国平均）
export function getAverageShippingCost(fromPref: Prefecture): number {
  const fromZone = PREFECTURE_ZONE[fromPref]
  const rates = Object.values(SHIPPING_TABLE[fromZone])
  return Math.round(rates.reduce((a, b) => a + b, 0) / rates.length)
}
