'use client'

import { useState, useMemo } from 'react'

/**
 * next/image を使わずに画像を表示する安全なコンポーネント。
 * - src が空／ロード失敗時はカテゴリに応じた絵文字＋グラデーション背景で
 *   「何の商品か」がひと目でわかるフォールバックを出す。
 */
interface ProductImageProps {
  src: string
  alt: string
  className?: string
  /** 商品カテゴリ。フォールバック絵文字・色の選択に使う */
  category?: string
  /** 商品名。フォールバック時の頭文字表示に使う */
  name?: string
}

type FallbackStyle = { emoji: string; gradient: string }

const FALLBACK_BY_KEYWORD: Array<[RegExp, FallbackStyle]> = [
  [/トレカ|カード|pokemon|ポケモン|ワンピース|遊戯王/i, { emoji: '🎴', gradient: 'from-rose-100 to-pink-200' }],
  [/ゲーム|switch|playstation|ps5|nintendo|xbox/i,      { emoji: '🎮', gradient: 'from-indigo-100 to-purple-200' }],
  [/lego|プラモ|ガンプラ|おもちゃ|ホビー|figure|フィギュア/i, { emoji: '🧱', gradient: 'from-amber-100 to-orange-200' }],
  [/ヘッドホン|イヤホン|airpods|オーディオ|スピーカー|sony|bose/i, { emoji: '🎧', gradient: 'from-slate-100 to-gray-300' }],
  [/カメラ|レンズ|canon|nikon|sony α|fuji/i,            { emoji: '📷', gradient: 'from-stone-100 to-zinc-300' }],
  [/掃除機|dyson|ダイソン|家電/i,                        { emoji: '🏠', gradient: 'from-teal-100 to-cyan-200' }],
  [/本|書籍|漫画|book/i,                                  { emoji: '📚', gradient: 'from-yellow-100 to-amber-200' }],
  [/コスメ|化粧|美容|beauty/i,                           { emoji: '💄', gradient: 'from-pink-100 to-rose-200' }],
  [/服|シューズ|sneaker|nike|adidas|ファッション/i,      { emoji: '👟', gradient: 'from-sky-100 to-blue-200' }],
  [/食品|お菓子|飲料/i,                                   { emoji: '🍱', gradient: 'from-lime-100 to-green-200' }],
]

function pickFallback(category?: string, name?: string): FallbackStyle {
  const hay = `${category ?? ''} ${name ?? ''}`
  for (const [re, style] of FALLBACK_BY_KEYWORD) {
    if (re.test(hay)) return style
  }
  return { emoji: '📦', gradient: 'from-gray-100 to-gray-200' }
}

function firstChar(name?: string): string {
  if (!name) return ''
  const s = name.replace(/[【\[\(（].*?[】\]\)）]/g, '').trim()
  return s.slice(0, 1)
}

export default function ProductImage({
  src, alt, className = 'h-full w-full object-contain', category, name,
}: ProductImageProps) {
  const [errored, setErrored] = useState(false)
  const fallback = useMemo(() => pickFallback(category, name ?? alt), [category, name, alt])

  if (!src || errored) {
    return (
      <div className={`flex h-full w-full flex-col items-center justify-center bg-gradient-to-br ${fallback.gradient}`}>
        <span className="text-2xl leading-none" aria-hidden>{fallback.emoji}</span>
        {firstChar(name ?? alt) && (
          <span className="mt-0.5 text-[9px] font-bold text-gray-600/70 max-w-[90%] truncate">
            {firstChar(name ?? alt)}
          </span>
        )}
      </div>
    )
  }

  // eslint-disable-next-line @next/next/no-img-element
  return <img src={src} alt={alt} className={className} onError={() => setErrored(true)} />
}
