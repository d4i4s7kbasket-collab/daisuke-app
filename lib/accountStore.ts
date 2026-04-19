import { createHash, randomBytes, timingSafeEqual } from 'crypto'
import { kv, kvGetJson, kvSetJson } from './kv'

/**
 * シンプルなアカウント管理。
 *
 * 設計:
 *   - ユーザーは「ニックネーム + 4桁PIN」で登録/ログインする。
 *   - ニックネームは大文字小文字・全角半角を揃えるため NFKC 正規化 + trim する。
 *   - 同じニックネームは作れない（一意）。
 *   - PIN は PBKDF2 風に salt + sha256(pin + salt) を複数回して保存する（平文保存しない）。
 *   - ログイン成功時は長いランダムトークン（セッションID）を発行し、KV に accountId を紐付ける。
 *   - クライアントはそのトークンを localStorage + `x-account-token` ヘッダで送る。
 *
 * KV キー設計:
 *   acct:id:{nickname}        -> accountId（ニックネームからIDを引く）
 *   acct:{accountId}           -> { id, nickname, pinHash, pinSalt, createdAt }
 *   session:{token}           -> accountId
 */

export interface AccountRecord {
  id: string
  nickname: string
  pinHash: string
  pinSalt: string
  createdAt: string
}

export interface PublicAccount {
  id: string
  nickname: string
}

/** ニックネームを正規化。全角半角・大文字小文字を揃え、前後空白を削除。 */
export function normalizeNickname(raw: string): string {
  return String(raw ?? '').normalize('NFKC').trim().toLowerCase()
}

function hashPin(pin: string, salt: string): string {
  // 簡易的に sha256 を数千回繰り返す。4桁PINは総当たりされやすいので意味は薄いが、
  // KV が漏れても平文よりマシな程度の保護にはなる。bcrypt を入れるほどではない。
  let h = createHash('sha256').update(pin + ':' + salt).digest('hex')
  for (let i = 0; i < 5000; i++) h = createHash('sha256').update(h).digest('hex')
  return h
}

function newId(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${randomBytes(4).toString('hex')}`
}

function isValidPin(pin: string): boolean {
  return /^\d{4}$/.test(pin)
}

function isValidNickname(nickname: string): boolean {
  // 1〜20文字、NFKC後にそれなりの文字であること
  return nickname.length >= 1 && nickname.length <= 40
}

const K = {
  idByNick: (nick: string) => `acct:id:${nick}`,
  account: (id: string) => `acct:${id}`,
  session: (token: string) => `session:${token}`,
}

export interface SignupResult {
  ok: true
  account: PublicAccount
  token: string
}

export interface AuthFailure {
  ok: false
  error: string
}

/** 新規アカウント作成。既に同名があれば失敗。 */
export async function signupAccount(
  nicknameRaw: string, pin: string,
): Promise<SignupResult | AuthFailure> {
  const nickname = normalizeNickname(nicknameRaw)
  if (!isValidNickname(nickname)) return { ok: false, error: 'ニックネームを入力してください（1〜40文字）' }
  if (!isValidPin(pin)) return { ok: false, error: 'PINは4桁の数字で入力してください' }

  const existing = await kv.get(K.idByNick(nickname))
  if (existing) return { ok: false, error: 'そのニックネームは既に使われています' }

  const id = newId('u')
  const salt = randomBytes(16).toString('hex')
  const pinHash = hashPin(pin, salt)
  const record: AccountRecord = {
    id,
    nickname: nicknameRaw.normalize('NFKC').trim(),
    pinHash,
    pinSalt: salt,
    createdAt: new Date().toISOString(),
  }
  await kvSetJson(K.account(id), record)
  await kv.set(K.idByNick(nickname), id)

  const token = await issueSession(id)
  return { ok: true, account: { id, nickname: record.nickname }, token }
}

/** ログイン。ニックネーム＋PIN。 */
export async function loginAccount(
  nicknameRaw: string, pin: string,
): Promise<SignupResult | AuthFailure> {
  const nickname = normalizeNickname(nicknameRaw)
  if (!isValidNickname(nickname) || !isValidPin(pin)) {
    return { ok: false, error: 'ニックネームとPINを正しく入力してください' }
  }

  const id = (await kv.get(K.idByNick(nickname))) as string | null
  if (!id) return { ok: false, error: 'ニックネームまたはPINが違います' }

  const record = await kvGetJson<AccountRecord>(K.account(id))
  if (!record) return { ok: false, error: 'アカウントが見つかりません' }

  const hashed = hashPin(pin, record.pinSalt)
  // timingSafeEqual は同じ長さのバッファ同士でないと投げるので長さ合わせしてから比較
  const a = Buffer.from(hashed, 'hex')
  const b = Buffer.from(record.pinHash, 'hex')
  const ok = a.length === b.length && timingSafeEqual(a, b)
  if (!ok) return { ok: false, error: 'ニックネームまたはPINが違います' }

  const token = await issueSession(id)
  return { ok: true, account: { id, nickname: record.nickname }, token }
}

/** セッショントークンを発行して KV に紐付け。 */
async function issueSession(accountId: string): Promise<string> {
  const token = randomBytes(24).toString('base64url')
  await kv.set(K.session(token), accountId)
  return token
}

/** セッショントークンから accountId を引く。 */
export async function accountIdFromToken(token: string | null | undefined): Promise<string | null> {
  if (!token) return null
  const v = await kv.get(K.session(token))
  return typeof v === 'string' ? v : null
}

/** アカウント情報を取得（公開情報のみ返す）。 */
export async function getPublicAccount(id: string): Promise<PublicAccount | null> {
  const record = await kvGetJson<AccountRecord>(K.account(id))
  if (!record) return null
  return { id: record.id, nickname: record.nickname }
}

/** ログアウト（セッション削除）。 */
export async function revokeSession(token: string): Promise<void> {
  await kv.del(K.session(token))
}
