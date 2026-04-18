export type Platform = 'rakuten' | 'amazon' | 'mercari' | 'yahoo' | 'paypay'
export type SalesVelocity = 'high' | 'medium' | 'low'
export type TrendDirection = 'rising' | 'stable' | 'falling'
export type CompetitionLevel = 'high' | 'medium' | 'low'
export type ApprovalStatus = 'pending' | 'approved' | 'rejected'

export interface CostBreakdown {
  buyPrice: number          // 仕入れ価格
  purchaseShipping: number  // 仕入れ送料
  platformFee: number       // 販売手数料
  sellShipping: number      // 発送費用
  totalCost: number         // 総コスト
  sellPrice: number         // 販売価格
  profit: number            // 純利益
  profitRate: number        // 利益率
}

export interface Product {
  id: string
  name: string
  imageUrl: string
  url: string
  category: string
  sourcePlatform: Platform   // 仕入れ元
  sellPlatform: Platform     // 販売先
  cost: CostBreakdown
  salesVelocity: SalesVelocity
  rank: number
  reviewCount: number
  rating: number
  lastUpdated: string
}

export interface Recommendation {
  id: string
  product: Product
  reason: string
  confidence: number
  estimatedMonthlySales: number
  buyQuantity: number
  status: ApprovalStatus
  createdAt: string
}

export interface SalesRecord {
  id: string
  productName: string
  category: string
  buyPrice: number
  sellPrice: number
  quantity: number
  profit: number
  profitRate: number
  platform: Platform
  soldAt: string
}

export interface MarketTrend {
  category: string
  trend: TrendDirection
  avgProfitRate: number
  competitionLevel: CompetitionLevel
  recommendedBrands: string[]
  insight: string
}

export interface DashboardStats {
  totalRevenue: number
  totalProfit: number
  profitRate: number
  totalItems: number
  pendingApprovals: number
  monthlyRevenue: MonthlyData[]
  categoryBreakdown: CategoryData[]
}

export interface MonthlyData {
  month: string
  revenue: number
  profit: number
  items: number
}

export interface CategoryData {
  category: string
  revenue: number
  profit: number
  count: number
}

export interface SearchFilters {
  keyword: string
  minProfitRate: number
  maxBuyPrice: number
  category: string
  platform: Platform | 'all'
}

export type InventoryStatus = 'in_stock' | 'listed' | 'sold' | 'returned'

export interface InventoryItem {
  id: string
  product: Product
  quantity: number
  remaining: number
  purchasedAt: string
  listedPrice?: number
  status: InventoryStatus
  memo?: string
}

export interface ListingTemplate {
  platform: Platform
  title: string
  description: string
  price: number
  tags: string[]
  shippingMethod: string
}

/** 店舗タイプ - 店舗せどり用 */
export type StoreType =
  | 'bookoff'       // ブックオフ
  | 'hardoff'       // ハードオフ
  | 'donki'         // ドン・キホーテ
  | 'yamada'        // ヤマダ電機
  | 'bic'           // ビックカメラ・ヨドバシ
  | 'toysrus'       // トイザらス・玩具店
  | 'geo'           // GEO
  | 'recycle'       // リサイクルショップ
  | 'super'         // スーパー・ドラッグストア
  | 'outlet'        // アウトレット・特価

/** 1プラットフォームあたりの相場・利益試算 */
export interface PlatformQuote {
  platform: Platform
  sellPrice: number      // 実売相場（想定）
  platformFee: number
  sellShipping: number
  profit: number         // 店頭価格を仕入れとしたときの純利益
  profitRate: number
  confidence: 'high' | 'medium' | 'low'   // 相場情報の信頼度
  note?: string
}

/** スキャン結果: ある店頭価格に対する全プラットフォームの比較 */
export interface ScanResult {
  query: string
  imageDataUrl?: string
  inStorePrice: number
  quotes: PlatformQuote[]
  bestPlatform: Platform
}

/** 店舗で見つかる＆利益が出やすい商品 */
export interface StoreDeal {
  id: string
  name: string
  category: string
  stores: StoreType[]                 // 置いてありそうな店舗
  inStorePriceRange: [number, number] // 店頭想定価格
  bestSellPlatform: Platform
  sellPriceRange: [number, number]    // 販売先想定価格
  estimatedProfit: number             // 平均想定利益（1個）
  hint: string                        // どこを探すかのヒント
  difficulty: 'easy' | 'normal' | 'hard'  // 見つけやすさ
  keywords: string[]
}
