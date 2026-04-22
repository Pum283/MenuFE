import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { Button } from './Button'

type ToastVariant = 'success' | 'error' | 'info'

type ToastItem = {
  id: string
  variant: ToastVariant
  message: string
  createdAtMs: number
  durationMs: number
  isClosing?: boolean
}

type ToastContextValue = {
  push: (message: string, options?: { variant?: ToastVariant; durationMs?: number }) => void
  success: (message: string, options?: { durationMs?: number }) => void
  error: (message: string, options?: { durationMs?: number }) => void
  info: (message: string, options?: { durationMs?: number }) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

function genId() {
  return `${Date.now()}_${Math.random().toString(16).slice(2)}`
}

function variantStyle(variant: ToastVariant): { border: string; bg: string; title: string } {
  if (variant === 'success') {
    return {
      border: 'border-[rgb(var(--fe-success))]',
      bg: 'bg-[rgba(var(--fe-success)/0.10)]',
      title: 'Thành công',
    }
  }
  if (variant === 'error') {
    return {
      border: 'border-[rgb(var(--fe-danger))]',
      bg: 'bg-[rgba(var(--fe-danger)/0.10)]',
      title: 'Lỗi',
    }
  }
  return {
    border: 'border-[rgb(var(--fe-line))]',
    bg: 'bg-white',
    title: 'Thông báo',
  }
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([])
  const timersRef = useRef<Record<string, number>>({})
  const closingTimersRef = useRef<Record<string, number>>({})

  const hardRemove = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
    const timer = timersRef.current[id]
    if (timer) window.clearTimeout(timer)
    delete timersRef.current[id]
    const closingTimer = closingTimersRef.current[id]
    if (closingTimer) window.clearTimeout(closingTimer)
    delete closingTimersRef.current[id]
  }, [])

  const closeWithAnimation = useCallback(
    (id: string) => {
      setToasts((prev) => prev.map((t) => (t.id === id ? { ...t, isClosing: true } : t)))
      const timer = timersRef.current[id]
      if (timer) window.clearTimeout(timer)
      delete timersRef.current[id]
      closingTimersRef.current[id] = window.setTimeout(() => hardRemove(id), 170)
    },
    [hardRemove],
  )

  const push = useCallback(
    (message: string, options?: { variant?: ToastVariant; durationMs?: number }) => {
      const variant = options?.variant ?? 'info'
      const durationMs = options?.durationMs ?? (variant === 'error' ? 6000 : 3500)
      const item: ToastItem = {
        id: genId(),
        variant,
        message,
        createdAtMs: Date.now(),
        durationMs,
      }
      setToasts((prev) => [item, ...prev].slice(0, 5))
      timersRef.current[item.id] = window.setTimeout(() => closeWithAnimation(item.id), durationMs)
    },
    [closeWithAnimation],
  )

  const value = useMemo<ToastContextValue>(
    () => ({
      push,
      success: (message, options) => push(message, { variant: 'success', durationMs: options?.durationMs }),
      error: (message, options) => push(message, { variant: 'error', durationMs: options?.durationMs }),
      info: (message, options) => push(message, { variant: 'info', durationMs: options?.durationMs }),
    }),
    [push],
  )

  useEffect(() => {
    return () => {
      for (const id of Object.keys(timersRef.current)) window.clearTimeout(timersRef.current[id])
      for (const id of Object.keys(closingTimersRef.current)) window.clearTimeout(closingTimersRef.current[id])
      timersRef.current = {}
      closingTimersRef.current = {}
    }
  }, [])

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed right-4 top-4 z-50 flex w-[360px] max-w-[calc(100vw-2rem)] flex-col gap-2">
        {toasts.map((t) => {
          const s = variantStyle(t.variant)
          return (
            <div
              key={t.id}
              className={[
                'pointer-events-auto rounded-(--fe-radius) border px-4 py-3 shadow-sm will-change-transform',
                t.isClosing ? 'animate-fe-toast-out' : 'animate-fe-toast-in',
                s.border,
                s.bg,
              ].join(' ')}
              role="status"
              aria-live="polite"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-xs font-bold text-[rgb(var(--fe-muted))]">{s.title}</div>
                  <div className="mt-1 wrap-break-word text-sm font-semibold text-[rgb(var(--fe-text))]">{t.message}</div>
                </div>
                <Button type="button" variant="secondary" onClick={() => closeWithAnimation(t.id)}>
                  Đóng
                </Button>
              </div>
            </div>
          )
        })}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within ToastProvider')
  return ctx
}

