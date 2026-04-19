'use client'

/**
 * クライアント側のログイン状態管理。
 *
 * セッショントークンは localStorage に `sedori-auth` として
 * { token, account: {id, nickname} } の形で保存する。
 * 全ての API 呼び出しは authFetch 経由にして、自動で `x-account-token` を付ける。
 */

const STORAGE_KEY = 'sedori-auth'

export interface AuthAccount {
  id: string
  nickname: string
}

export interface AuthState {
  token: string
  account: AuthAccount
}

export function loadAuth(): AuthState | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as AuthState
    if (!parsed?.token || !parsed?.account?.id) return null
    return parsed
  } catch { return null }
}

export function saveAuth(state: AuthState): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
}

export function clearAuth(): void {
  if (typeof window === 'undefined') return
  localStorage.removeItem(STORAGE_KEY)
}

/** サーバーAPI呼び出し用 fetch ラッパ。認証ヘッダを自動で付ける。 */
export async function authFetch(input: RequestInfo | URL, init: RequestInit = {}): Promise<Response> {
  const auth = loadAuth()
  const headers = new Headers(init.headers)
  if (auth) headers.set('x-account-token', auth.token)
  if (init.body && !headers.has('content-type')) {
    headers.set('content-type', 'application/json')
  }
  return fetch(input, { ...init, headers })
}

/** 新規登録 */
export async function signup(nickname: string, pin: string): Promise<AuthState> {
  const res = await fetch('/api/account/signup', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ nickname, pin }),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data?.error ?? '登録に失敗しました')
  const state: AuthState = { token: data.token, account: data.account }
  saveAuth(state)
  return state
}

/** ログイン */
export async function login(nickname: string, pin: string): Promise<AuthState> {
  const res = await fetch('/api/account/login', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ nickname, pin }),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data?.error ?? 'ログインに失敗しました')
  const state: AuthState = { token: data.token, account: data.account }
  saveAuth(state)
  return state
}

/** ログアウト（サーバー側のセッションも無効化） */
export async function logout(): Promise<void> {
  try { await authFetch('/api/account/me', { method: 'DELETE' }) } catch { /* ignore */ }
  clearAuth()
}
