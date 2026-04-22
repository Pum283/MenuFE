import { useEffect } from 'react'

type Props = {
  title: string
  isOpen: boolean
  onClose: () => void
  children: React.ReactNode
  footer?: React.ReactNode
  maxWidthClassName?: string
}

export function Modal({ title, isOpen, onClose, children, footer, maxWidthClassName }: Props) {
  useEffect(() => {
    if (!isOpen) return
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-4 py-6"
      role="dialog"
      aria-modal="true"
      aria-label={title}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div className="absolute inset-0 bg-black/40" />
      <div
        className={[
          'relative w-full rounded-(--fe-radius) border border-[rgb(var(--fe-line))] bg-white shadow-[0_25px_80px_rgba(0,0,0,0.20)]',
          maxWidthClassName ?? 'max-w-2xl',
        ].join(' ')}
      >
        <div className="flex items-start justify-between gap-4 border-b border-[rgb(var(--fe-line))] px-5 py-4">
          <div className="text-base font-semibold text-[rgb(var(--fe-text))]">{title}</div>
          <button
            type="button"
            className="rounded-(--fe-radius) border border-[rgb(var(--fe-line))] bg-white px-3 py-2 text-sm font-semibold text-[rgb(var(--fe-text))] hover:bg-[rgb(var(--fe-surface))]"
            onClick={onClose}
          >
            Đóng
          </button>
        </div>

        <div className="max-h-[75dvh] overflow-auto px-5 py-5">{children}</div>

        {footer ? (
          <div className="border-t border-[rgb(var(--fe-line))] px-5 py-4">
            <div className="flex items-center justify-end gap-2">{footer}</div>
          </div>
        ) : null}
      </div>
    </div>
  )
}

