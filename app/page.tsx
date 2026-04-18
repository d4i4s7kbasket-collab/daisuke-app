'use client'

import { useState, useEffect, useCallback } from 'react'
import { BarChart3, TrendingUp, Package, Search, History, Sparkles, Boxes, Camera } from 'lucide-react'
import clsx from 'clsx'

import Header from '@/components/Header'
import StatCard from '@/components/StatCard'
import RevenueChart from '@/components/RevenueChart'
import CategoryChart from '@/components/CategoryChart'
import ProductCard from '@/components/ProductCard'
import MarketTrendCard from '@/components/MarketTrendCard'
import RecommendationCard from '@/components/RecommendationCard'
import ApprovalModal from '@/components/ApprovalModal'
import SalesCalculator from '@/components/SalesCalculator'
import SalesTable from '@/components/SalesTable'
import SettingsModal from '@/components/SettingsModal'
import InventoryTable, { InventorySummary } from '@/components/InventoryTable'
import TemplateModal from '@/components/TemplateModal'
import BudgetWidget from '@/components/BudgetWidget'
import StoreScanner from '@/components/StoreScanner'
import StoreDealList from '@/components/StoreDealList'

import type { Product, Recommendation, SalesRecord, MarketTrend, DashboardStats, InventoryItem } from '@/lib/types'
import { formatCurrency } from '@/lib/calculations'
import { MOCK_DASHBOARD } from '@/lib/mockData'
import type { UserSettings } from '@/lib/settings'
import { DEFAULT_SETTINGS } from '@/lib/settings'
import { monthlySpent, budgetStatus } from '@/lib/budget'

type Tab = 'recommendations' | 'store' | 'inventory' | 'dashboard' | 'products' | 'trends' | 'calculator' | 'history'

const TABS: { id: Tab; label: string; icon: React.ElementType }[] = [
  { id: 'recommendations', label: 'AI提案', icon: Sparkles },
  { id: 'store', label: '店舗せどり', icon: Camera },
  { id: 'inventory', label: '在庫管理', icon: Boxes },
  { id: 'dashboard', label: 'ダッシュボード', icon: BarChart3 },
  { id: 'products', label: '商品検索', icon: Search },
  { id: 'trends', label: '市場分析', icon: TrendingUp },
  { id: 'calculator', label: '利益計算', icon: Package },
  { id: 'history', label: '販売履歴', icon: History },
]

export default function HomePage() {
  const [tab, setTab] = useState<Tab>('recommendations')
  const [lastUpdated, setLastUpdated] = useState(new Date())
  const [products, setProducts] = useState<Product[]>([])
  const [trends, setTrends] = useState<MarketTrend[]>([])
  const [recommendations, setRecommendations] = useState<Recommendation[]>([])
  const [sales, setSales] = useState<SalesRecord[]>([])
  const [dashboard, setDashboard] = useState<DashboardStats>(MOCK_DASHBOARD)
  const [selectedRec, setSelectedRec] = useState<Recommendation | null>(null)
  const [searchKeyword, setSearchKeyword] = useState('')
  const [loading, setLoading] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [settings, setSettings] = useState<UserSettings>(DEFAULT_SETTINGS)
  const [inventory, setInventory] = useState<InventoryItem[]>([])
  const [templateProduct, setTemplateProduct] = useState<Product | null>(null)

  // localStorage から設定を読み込む
  useEffect(() => {
    try {
      const saved = localStorage.getItem('sedori-settings')
      if (saved) setSettings(JSON.parse(saved))
    } catch { /* ignore */ }
  }, [])

  const saveSettings = (s: UserSettings) => {
    setSettings(s)
    try { localStorage.setItem('sedori-settings', JSON.stringify(s)) } catch { /* ignore */ }
  }

  const fetchAll = useCallback(async () => {
    setLoading(true)
    try {
      const [pRes, aRes, rRes, sRes, iRes] = await Promise.all([
        fetch('/api/products'),
        fetch('/api/analyze'),
        fetch('/api/recommendations'),
        fetch('/api/sales'),
        fetch('/api/inventory'),
      ])
      const [pData, aData, rData, sData, iData] = await Promise.all([
        pRes.json(), aRes.json(), rRes.json(), sRes.json(), iRes.json(),
      ])
      setProducts(pData.products ?? [])
      setTrends(aData.trends ?? [])
      setDashboard(aData.dashboard ?? MOCK_DASHBOARD)
      setRecommendations(rData.recommendations ?? [])
      setSales(sData.sales ?? [])
      setInventory(iData.items ?? [])
      setLastUpdated(new Date())
    } catch (err) {
      console.error('データ取得エラー:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchAll()
    const id = setInterval(fetchAll, 60 * 60 * 1000)
    return () => clearInterval(id)
  }, [fetchAll])

  const handleApprove = async (id: string) => {
    const res = await fetch('/api/recommendations', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status: 'approved' }),
    })
    const data = await res.json().catch(() => null)
    setRecommendations((prev) => prev.map((r) => r.id === id ? { ...r, status: 'approved' } : r))
    if (data?.inventory) {
      setInventory((prev) => [data.inventory, ...prev])
    }
    setSelectedRec(null)
  }

  const handleInventoryUpdate = async (id: string, patch: Partial<InventoryItem>) => {
    const res = await fetch('/api/inventory', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, ...patch }),
    })
    const data = await res.json().catch(() => null)
    if (data?.item) {
      setInventory((prev) => prev.map((i) => (i.id === id ? data.item : i)))
    }
  }

  const handleInventoryRemove = async (id: string) => {
    await fetch(`/api/inventory?id=${encodeURIComponent(id)}`, { method: 'DELETE' })
    setInventory((prev) => prev.filter((i) => i.id !== id))
  }

  const handleReject = async (id: string) => {
    await fetch('/api/recommendations', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status: 'rejected' }),
    })
    setRecommendations((prev) => prev.map((r) => r.id === id ? { ...r, status: 'rejected' } : r))
    setSelectedRec(null)
  }

  const handleSearch = async () => {
    if (!searchKeyword.trim()) return
    setLoading(true)
    try {
      const res = await fetch(`/api/products?keyword=${encodeURIComponent(searchKeyword)}`)
      const data = await res.json()
      setProducts(data.products ?? [])
    } finally {
      setLoading(false)
    }
  }

  const pendingCount = recommendations.filter((r) => r.status === 'pending').length
  const budget = budgetStatus(settings.monthlyBudget, monthlySpent(inventory))

  return (
    <div className="min-h-screen bg-gray-50">
      <Header
        lastUpdated={lastUpdated}
        onRefresh={fetchAll}
        pendingCount={pendingCount}
        settings={settings}
        onOpenSettings={() => setShowSettings(true)}
      />

      {/* タブ */}
      <nav className="sticky top-14 z-30 bg-white border-b shadow-sm">
        <div className="mx-auto max-w-3xl px-4">
          <div className="flex overflow-x-auto scrollbar-hide">
            {TABS.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setTab(id)}
                className={clsx(
                  'relative flex items-center gap-1.5 whitespace-nowrap px-4 py-3 text-xs font-medium transition-colors flex-shrink-0',
                  tab === id
                    ? 'text-indigo-600 after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-indigo-600'
                    : 'text-gray-500 hover:text-gray-700'
                )}
              >
                <Icon className="h-3.5 w-3.5" />
                {label}
                {id === 'recommendations' && pendingCount > 0 && (
                  <span className="rounded-full bg-indigo-600 px-1.5 py-0.5 text-[9px] font-bold text-white leading-none">
                    {pendingCount}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      </nav>

      <main className="mx-auto max-w-3xl px-4 py-5">
        {/* ローディング */}
        {loading && (
          <div className="fixed bottom-4 right-4 z-50 flex items-center gap-2 rounded-full bg-gray-800/80 backdrop-blur-sm px-4 py-2 text-xs text-white shadow-lg">
            <span className="h-3 w-3 animate-spin rounded-full border-2 border-white border-t-transparent" />
            更新中...
          </div>
        )}

        {tab === 'recommendations' && (
          <div className="space-y-4">
            <BudgetWidget monthlyBudget={settings.monthlyBudget} inventory={inventory} compact />
            <RecommendationsTab recommendations={recommendations} onReview={setSelectedRec} />
          </div>
        )}
        {tab === 'store' && <StoreTab />}
        {tab === 'inventory' && (
          <InventoryTab
            items={inventory}
            monthlyBudget={settings.monthlyBudget}
            onUpdate={handleInventoryUpdate}
            onRemove={handleInventoryRemove}
            onShowTemplate={(item) => setTemplateProduct(item.product)}
          />
        )}
        {tab === 'dashboard' && (
          <div className="space-y-4">
            <BudgetWidget monthlyBudget={settings.monthlyBudget} inventory={inventory} />
            <DashboardTab dashboard={dashboard} />
          </div>
        )}
        {tab === 'products' && (
          <ProductsTab
            products={products}
            searchKeyword={searchKeyword}
            onSearchChange={setSearchKeyword}
            onSearch={handleSearch}
          />
        )}
        {tab === 'trends' && <TrendsTab trends={trends} />}
        {tab === 'calculator' && (
          <div className="max-w-md mx-auto">
            <SalesCalculator settings={settings} />
          </div>
        )}
        {tab === 'history' && <SalesTable records={sales} />}
      </main>

      {selectedRec && (
        <ApprovalModal
          rec={selectedRec}
          onApprove={handleApprove}
          onReject={handleReject}
          onClose={() => setSelectedRec(null)}
          budgetRemaining={budget.remaining}
        />
      )}

      {showSettings && (
        <SettingsModal
          settings={settings}
          onSave={saveSettings}
          onClose={() => setShowSettings(false)}
        />
      )}

      {templateProduct && (
        <TemplateModal product={templateProduct} onClose={() => setTemplateProduct(null)} />
      )}
    </div>
  )
}

function StoreTab() {
  const [mode, setMode] = useState<'scan' | 'deals'>('scan')
  return (
    <div className="space-y-4">
      {/* モード切替 */}
      <div className="rounded-xl bg-gray-100 p-1 flex">
        <button
          onClick={() => setMode('scan')}
          className={clsx(
            'flex-1 rounded-lg py-2 text-xs font-bold transition-colors flex items-center justify-center gap-1.5',
            mode === 'scan' ? 'bg-white text-indigo-700 shadow' : 'text-gray-500'
          )}
        >
          <Camera className="h-3.5 w-3.5" />
          店舗スキャン
        </button>
        <button
          onClick={() => setMode('deals')}
          className={clsx(
            'flex-1 rounded-lg py-2 text-xs font-bold transition-colors flex items-center justify-center gap-1.5',
            mode === 'deals' ? 'bg-white text-indigo-700 shadow' : 'text-gray-500'
          )}
        >
          <TrendingUp className="h-3.5 w-3.5" />
          店舗おすすめ
        </button>
      </div>
      {mode === 'scan' ? <StoreScanner /> : <StoreDealList />}
    </div>
  )
}

function InventoryTab({
  items, monthlyBudget, onUpdate, onRemove, onShowTemplate,
}: {
  items: InventoryItem[]
  monthlyBudget: number
  onUpdate: (id: string, patch: Partial<InventoryItem>) => void
  onRemove: (id: string) => void
  onShowTemplate: (item: InventoryItem) => void
}) {
  return (
    <div className="space-y-4">
      <BudgetWidget monthlyBudget={monthlyBudget} inventory={items} compact />
      <InventorySummary items={items} />
      <InventoryTable
        items={items}
        onUpdate={onUpdate}
        onRemove={onRemove}
        onShowTemplate={onShowTemplate}
      />
    </div>
  )
}

/* ── Tabs ─────────────────────────────────── */

function RecommendationsTab({
  recommendations, onReview,
}: { recommendations: Recommendation[]; onReview: (r: Recommendation) => void }) {
  const pending = recommendations.filter((r) => r.status === 'pending')
  const done = recommendations.filter((r) => r.status !== 'pending')

  return (
    <div className="space-y-4">
      {pending.length > 0 ? (
        <section>
          <div className="flex items-center gap-2 mb-3">
            <span className="h-2 w-2 rounded-full bg-indigo-500 animate-pulse" />
            <h3 className="text-xs font-semibold text-gray-500">承認待ち（{pending.length}件）— タップして確認</h3>
          </div>
          <div className="space-y-3">
            {pending.map((r) => <RecommendationCard key={r.id} rec={r} onReview={onReview} />)}
          </div>
        </section>
      ) : (
        <div className="rounded-2xl border border-dashed border-gray-200 py-12 text-center">
          <Sparkles className="h-8 w-8 text-gray-200 mx-auto mb-2" />
          <p className="text-sm text-gray-400">承認待ちの提案はありません</p>
          <p className="text-xs text-gray-300 mt-1">次回の自動分析までお待ちください</p>
        </div>
      )}
      {done.length > 0 && (
        <section>
          <h3 className="text-xs font-semibold text-gray-400 mb-2">処理済み</h3>
          <div className="space-y-2">
            {done.map((r) => <RecommendationCard key={r.id} rec={r} />)}
          </div>
        </section>
      )}
    </div>
  )
}

function DashboardTab({ dashboard }: { dashboard: DashboardStats }) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <StatCard title="累計売上" value={formatCurrency(dashboard.totalRevenue)} icon={<BarChart3 className="h-4 w-4" />} trend={8.2} />
        <StatCard title="累計利益" value={formatCurrency(dashboard.totalProfit)} icon={<TrendingUp className="h-4 w-4" />} color="profit" trend={12.5} />
        <StatCard title="平均利益率" value={`${dashboard.profitRate.toFixed(1)}%`} icon={<Sparkles className="h-4 w-4" />} trend={1.8} />
        <StatCard title="総取引数" value={`${dashboard.totalItems}件`} icon={<Package className="h-4 w-4" />} trend={5.0} />
      </div>
      <RevenueChart data={dashboard.monthlyRevenue} />
      <CategoryChart data={dashboard.categoryBreakdown} />
      <div className="rounded-2xl border bg-white p-4 shadow-sm">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">カテゴリ別パフォーマンス</h3>
        <div className="space-y-2.5">
          {dashboard.categoryBreakdown.map((cat) => {
            const rate = (cat.profit / cat.revenue) * 100
            return (
              <div key={cat.category} className="flex items-center gap-3">
                <span className="w-14 text-xs text-gray-600 flex-shrink-0">{cat.category}</span>
                <div className="flex-1 h-1.5 rounded-full bg-gray-100 overflow-hidden">
                  <div className="h-full rounded-full bg-indigo-500 transition-all" style={{ width: `${Math.min(rate * 2.5, 100)}%` }} />
                </div>
                <span className="text-xs font-semibold text-gray-700 w-16 text-right">{formatCurrency(cat.profit)}</span>
                <span className="text-xs text-emerald-600 font-medium w-10 text-right">{rate.toFixed(1)}%</span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

function ProductsTab({
  products, searchKeyword, onSearchChange, onSearch,
}: {
  products: Product[]
  searchKeyword: string
  onSearchChange: (v: string) => void
  onSearch: () => void
}) {
  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <input
          type="text"
          value={searchKeyword}
          onChange={(e) => onSearchChange(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && onSearch()}
          placeholder="商品名で検索（例: Nintendo Switch）"
          className="flex-1 rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
        />
        <button
          onClick={onSearch}
          className="rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-indigo-700 transition-colors flex items-center gap-1.5"
        >
          <Search className="h-4 w-4" />
          検索
        </button>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {products.map((p) => <ProductCard key={p.id} product={p} />)}
      </div>
    </div>
  )
}

function TrendsTab({ trends }: { trends: MarketTrend[] }) {
  return (
    <div className="space-y-3">
      <div className="rounded-xl bg-indigo-50 border border-indigo-100 px-4 py-3">
        <p className="text-xs text-indigo-700">市場トレンドを分析中。1時間おきに自動更新されます。</p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {trends.map((t) => <MarketTrendCard key={t.category} trend={t} />)}
      </div>
    </div>
  )
}
