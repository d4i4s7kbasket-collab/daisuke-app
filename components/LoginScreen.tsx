'use client'

import { useState } from 'react'
import clsx from 'clsx'
import { Sparkles, User, Lock, LogIn, UserPlus, ArrowRight } from 'lucide-react'
import { login, signup, type AuthState } from '@/lib/authClient'

interface Props {
  onLoggedIn: (auth: AuthState) => void
}

export default function LoginScreen({ onLoggedIn }: Props) {
  const [mode, setMode] = useState<'login' | 'signup'>('login')
  const [nickname, setNickname] = useState('')
  const [pin, setPin] = useState('')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  const valid = nickname.trim().length >= 1 && /^\d{4}$/.test(pin)

  const submit = async () => {
    if (!valid || busy) return
    setBusy(true); setErr(null)
    try {
      const state = mode === 'login'
        ? await login(nickname, pin)
        : await signup(nickname, pin)
      onLoggedIn(state)
    } catch (e) {
      setErr(e instanceof Error ? e.message : '失敗しました')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-rose-50 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center h-14 w-14 rounded-2xl bg-indigo-600 text-white shadow-lg shadow-indigo-200 mb-3">
            <Sparkles className="h-7 w-7" />
          </div>
          <h1 className="text-xl font-bold text-gray-900">せどりナビ</h1>
          <p className="text-xs text-gray-500 mt-1">
            ニックネームとPINを覚えておけば<br />スマホでもPCでも同じデータが見えます
          </p>
        </div>

        {/* タブ切替 */}
        <div className="flex rounded-xl bg-gray-100 p-1 mb-4">
          <button
            onClick={() => { setMode('login'); setErr(null) }}
            className={clsx(
              'flex-1 rounded-lg py-2 text-xs font-bold transition-colors flex items-center justify-center gap-1',
              mode === 'login' ? 'bg-white text-indigo-700 shadow' : 'text-gray-500'
            )}
          >
            <LogIn className="h-3.5 w-3.5" />
            ログイン
          </button>
          <button
            onClick={() => { setMode('signup'); setErr(null) }}
            className={clsx(
              'flex-1 rounded-lg py-2 text-xs font-bold transition-colors flex items-center justify-center gap-1',
              mode === 'signup' ? 'bg-white text-indigo-700 shadow' : 'text-gray-500'
            )}
          >
            <UserPlus className="h-3.5 w-3.5" />
            新規登録
          </button>
        </div>

        <div className="rounded-2xl bg-white border border-gray-100 shadow-sm p-5 space-y-3">
          <div>
            <label className="text-[11px] font-bold text-gray-600 block mb-1">
              <User className="inline h-3 w-3 mr-1" />
              ニックネーム
            </label>
            <input
              type="text"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder="例: だいすけ"
              autoComplete="username"
              className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
            />
          </div>

          <div>
            <label className="text-[11px] font-bold text-gray-600 block mb-1">
              <Lock className="inline h-3 w-3 mr-1" />
              PIN（4桁の数字）
            </label>
            <input
              type="password"
              inputMode="numeric"
              pattern="\d*"
              maxLength={4}
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/[^\d]/g, '').slice(0, 4))}
              placeholder="••••"
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-lg tracking-[0.5em] text-center font-bold focus:outline-none focus:ring-2 focus:ring-indigo-300"
            />
            {mode === 'signup' && (
              <p className="text-[10px] text-gray-400 mt-1">
                ※ PINは忘れないようにしてください（4桁の数字、例: 1234）
              </p>
            )}
          </div>

          {err && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-600">
              {err}
            </div>
          )}

          <button
            type="button"
            onClick={submit}
            disabled={!valid || busy}
            className={clsx(
              'w-full rounded-xl text-white text-sm font-bold py-2.5 flex items-center justify-center gap-1 transition-colors',
              !valid || busy
                ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                : 'bg-indigo-600 hover:bg-indigo-700'
            )}
          >
            {busy ? '処理中...' : mode === 'login' ? 'ログイン' : 'アカウント作成'}
            {!busy && <ArrowRight className="h-4 w-4" />}
          </button>
        </div>

        <p className="text-[10px] text-center text-gray-400 mt-4 px-4 leading-relaxed">
          ※ 同じニックネームとPINをスマホ・PC どちらで入力しても同じデータが表示されます。<br />
          ※ デモ用の簡易認証です。共有端末での使用はお控えください。
        </p>
      </div>
    </div>
  )
}
