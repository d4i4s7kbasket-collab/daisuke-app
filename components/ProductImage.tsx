'use client'

// next/image を使わずに画像を表示する安全なコンポーネント
interface ProductImageProps {
  src: string
  alt: string
  className?: string
}

export default function ProductImage({ src, alt, className = 'h-full w-full object-contain' }: ProductImageProps) {
  if (!src) return <div className="flex h-full w-full items-center justify-center text-[10px] text-gray-300">No img</div>
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={src} alt={alt} className={className} onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }} />
}
