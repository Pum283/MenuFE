import { useEffect } from 'react'
import { toCloudinaryBestQualityUrl } from '../../utils/cloudinary'

type Props = {
  src: string | null
  alt: string
  isOpen: boolean
  onClose: () => void
}

export function ImageLightbox({ src, alt, isOpen, onClose }: Props) {
  useEffect(() => {
    if (!isOpen) return
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [isOpen, onClose])

  if (!isOpen || !src) return null
  const displaySrc = toCloudinaryBestQualityUrl(src)

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-4 py-6"
      role="dialog"
      aria-modal="true"
      aria-label="Xem ảnh"
    >
      <div className="absolute inset-0 bg-black/70" onMouseDown={onClose} />
      <div
        className="relative w-full max-w-5xl"
        onMouseDown={(e) => {
          e.stopPropagation()
        }}
      >
        <button
          type="button"
          className="absolute -top-12 right-0 rounded-(--fe-radius) border border-white/20 bg-black/40 px-3 py-2 text-sm font-semibold text-white hover:bg-black/55"
          onClick={onClose}
        >
          Đóng
        </button>
        <div className="overflow-hidden rounded-(--fe-radius) border border-white/10 bg-white shadow-[0_25px_80px_rgba(0,0,0,0.35)]">
          <img src={displaySrc} alt={alt} className="max-h-[80dvh] w-full bg-white object-contain" />
        </div>
      </div>
    </div>
  )
}

