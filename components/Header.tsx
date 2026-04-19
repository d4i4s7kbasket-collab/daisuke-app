'use client'

import { RefreshCw, Bell, TrendingUp, Settings, LogOut } from 'lucide-react'
import { useState, useEffect } from 'react'
import { formatDistanceToNow } from 'date-fns'
import { ja } from 'date-fns/locale'
import type { UserSettings } from '@/lib/settings'

interface HeaderProps {
  lastUpdated: Date
  onRefresh: () => void
  pendingCount: number
  settings: UserSettings
  onOpenSettings: () => void
  /** ログイン中のニックネーム（あればヘッダに表示） */
  accountName?: string
  /** ログアウトボタンを押したとき */
  onLogout?: () => void
}

export default function Header({
  lastUpdated, onRefresh, pendingCount, settings, onOpenSettings, accountName, onLogout,
}: HeaderProps) {
  const [spinning, setSpinning] = useState(false)
  const [timeAgo, setTimeAgo] = useState<string | null>(null)

  useEffect(() => {
    const update = () =>
      setTimeAgo(formatDistanceToNow(lastUpdated, { addSuffix: true, locale: ja }))
    update()
    const id = setInterval(update, 30_000)
    return () => clearInterval(id)
  }, [lastUpdated])

  const handleRefresh = () => {
    setSpinning(true)
    onRefresh()
    setTimeout(() => setSpinning(false), 1000)
  }

  return (
    <header className="sticky top-0 z-40 border-b bg-white/90 backdrop-blur-md">
      <div className="mx-auto max-w-3xl px-4">
        <div className="flex h-14 items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="rounded-xl bg-indigo-600 p-1.5">
              <TrendingUp className="h-4 w-4 text-white" />
            </div>
            <div>
              <h1 className="text-sm font-bold text-gray-900 leading-tight">せどりナビ</h1>
              <p className="text-[10px] text-gray-400 leading-none">
                {accountName ? `${accountName} · ` : ''}{settings.prefecture} · 更新 {timeAgo}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {pendingCount > 0 && (
              <div className="flex items-center gap-1 rounded-full bg-indigo-600 px-2.5 py-1">
                <Bell className="h-3 w-3 text-white" />
                <span className="text-[11px] font-bold text-white">{pendingCount}</span>
              </div>
            )}
            <button
              onClick={onOpenSettings}
              className="rounded-xl border border-gray-200 p-2 hover:bg-gray-50 transition-colors"
              title="設定"
            >
              <Settings className="h-4 w-4 text-gray-500" />
            </button>
            <button
              onClick={handleRefresh}
              className="rounded-xl border border-gray-200 p-2 hover:bg-gray-50 transition-colors"
              title="更新"
            >
              <RefreshCw className={`h-4 w-4 text-gray-500 transition-transform duration-700 ${spinning ? 'animate-spin' : ''}`} />
            </button>
            {onLogout && (
              <button
                onClick={() => { if (confirm('ログアウトしますか？')) onLogout() }}
                className="rounded-xl border border-gray-200 p-2 hover:bg-gray-50 transition-colors"
                title="ログアウト"
              >
                <LogOut className="h-4 w-4 text-gray-500" />
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
