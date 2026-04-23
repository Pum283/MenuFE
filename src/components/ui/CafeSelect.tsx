import { useEffect, useId, useMemo, useRef, useState } from 'react'
import type { CafeDto } from '../../types/api'

type Props = {
  label: string
  showLabel?: boolean
  cafes: CafeDto[]
  value: string | null
  disabled?: boolean
  placeholder: string
  emptyText: string
  onChange: (nextCafeId: string | null) => void
}

function getCafeLabel(cafe: CafeDto) {
  return cafe.name.trim() ? cafe.name : cafe.code
}

function getCafeMonogram(cafe: CafeDto) {
  const label = getCafeLabel(cafe).trim()
  return label ? label.slice(0, 1).toUpperCase() : '•'
}

export function CafeSelect({ label, showLabel, cafes, value, disabled, placeholder, emptyText, onChange }: Props) {
  const listboxId = useId()
  const buttonRef = useRef<HTMLButtonElement | null>(null)
  const listRef = useRef<HTMLDivElement | null>(null)
  const optionRefs = useRef<Array<HTMLButtonElement | null>>([])
  const [isOpen, setIsOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState<number>(() => Math.max(0, cafes.findIndex((c) => c.id === value)))

  const selectedCafe = useMemo(() => cafes.find((c) => c.id === value) ?? null, [cafes, value])
  const hasSelection = Boolean(selectedCafe)

  useEffect(() => {
    setActiveIndex(Math.max(0, cafes.findIndex((c) => c.id === value)))
  }, [cafes, value])

  useEffect(() => {
    if (!isOpen) return
    const onDocMouseDown = (e: MouseEvent) => {
      const t = e.target as Node | null
      if (!t) return
      if (buttonRef.current?.contains(t)) return
      if (listRef.current?.contains(t)) return
      setIsOpen(false)
    }
    document.addEventListener('mousedown', onDocMouseDown)
    return () => document.removeEventListener('mousedown', onDocMouseDown)
  }, [isOpen])

  useEffect(() => {
    if (!isOpen) return
    optionRefs.current[activeIndex]?.scrollIntoView({ block: 'nearest' })
  }, [activeIndex, isOpen])

  function commitSelection(nextIndex: number) {
    const cafe = cafes[nextIndex]
    onChange(cafe ? cafe.id : null)
    setIsOpen(false)
    buttonRef.current?.focus()
  }

  return (
    <div className="w-full">
      {showLabel === false ? null : <div className="text-sm font-semibold text-[rgb(var(--fe-muted))]">{label}</div>}

      <div className={showLabel === false ? 'relative' : 'relative mt-2'}>
        <button
          ref={buttonRef}
          type="button"
          disabled={disabled || cafes.length === 0}
          aria-haspopup="listbox"
          aria-expanded={isOpen}
          aria-controls={listboxId}
          onClick={() => setIsOpen((v) => !v)}
          onKeyDown={(e) => {
            if (disabled || cafes.length === 0) return

            if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
              e.preventDefault()
              setIsOpen(true)
              setActiveIndex((idx) => {
                const delta = e.key === 'ArrowDown' ? 1 : -1
                const next = Math.min(Math.max(idx + delta, 0), Math.max(cafes.length - 1, 0))
                return next
              })
              return
            }

            if (e.key === 'Enter' && isOpen) {
              e.preventDefault()
              commitSelection(activeIndex)
              return
            }

            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault()
              setIsOpen((v) => !v)
              return
            }

            if (e.key === 'Escape') {
              setIsOpen(false)
            }
          }}
          className={[
            'flex w-full items-center justify-between gap-3 rounded-(--fe-radius) border bg-white px-4 py-3 text-left text-sm text-[rgb(var(--fe-text))] outline-none transition-[box-shadow,border-color,background-color] duration-150',
            isOpen ? 'border-[rgb(var(--fe-accent))] shadow-[0_16px_60px_rgba(0,0,0,0.12)]' : 'border-[rgb(var(--fe-line))]',
            hasSelection ? 'bg-[rgb(var(--fe-surface))]' : 'bg-white',
            'disabled:cursor-not-allowed disabled:bg-[rgb(var(--fe-surface))] disabled:text-[rgb(var(--fe-muted))]',
          ].join(' ')}
        >
          <div className="flex min-w-0 items-center gap-3">
            <div
              className={[
                'flex h-9 w-9 shrink-0 items-center justify-center rounded-(--fe-radius) text-sm font-semibold',
                hasSelection ? 'bg-[rgba(var(--fe-accent),0.12)] text-[rgb(var(--fe-accent))]' : 'bg-[rgb(var(--fe-surface))] text-[rgb(var(--fe-muted))]',
              ].join(' ')}
              aria-hidden="true"
            >
              {selectedCafe ? getCafeMonogram(selectedCafe) : '—'}
            </div>
            {selectedCafe ? (
              <div className="min-w-0">
                <div className="truncate text-base font-semibold tracking-tight">{getCafeLabel(selectedCafe)}</div>
              </div>
            ) : (
              <div className="min-w-0">
                <div className="truncate text-base font-semibold text-[rgb(var(--fe-muted))]">
                  {cafes.length === 0 ? emptyText : placeholder}
                </div>
              </div>
            )}
          </div>
          <div className="flex shrink-0 items-center gap-2" aria-hidden="true">
            {hasSelection ? <span className="h-2 w-2 rounded-full bg-[rgb(var(--fe-accent))]" /> : null}
            <span className={isOpen ? 'text-[rgb(var(--fe-accent))]' : 'text-[rgb(var(--fe-muted))]'}>▾</span>
          </div>
        </button>

        {isOpen ? (
          <div
            ref={listRef}
            id={listboxId}
            role="listbox"
            aria-label={label}
            tabIndex={-1}
            className="absolute z-20 mt-2 w-full overflow-hidden rounded-(--fe-radius) border border-[rgb(var(--fe-line))] bg-white shadow-[0_25px_80px_rgba(0,0,0,0.10)]"
            onKeyDown={(e) => {
              if (e.key === 'Escape') {
                setIsOpen(false)
                buttonRef.current?.focus()
              }
            }}
          >
            <div className="max-h-72 overflow-auto p-2">
              {cafes.map((cafe, idx) => {
                const isSelected = cafe.id === value
                const isActive = idx === activeIndex
                return (
                  <button
                    key={cafe.id}
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    ref={(el) => {
                      optionRefs.current[idx] = el
                    }}
                    onMouseEnter={() => setActiveIndex(idx)}
                    onClick={() => commitSelection(idx)}
                    className={[
                      'flex w-full items-center gap-3 rounded-(--fe-radius) border px-3 py-3 text-left outline-none transition-[background-color,border-color,box-shadow] duration-150',
                      isSelected
                        ? 'border-[rgba(var(--fe-text),0.22)] bg-[rgba(var(--fe-accent),0.10)]'
                        : 'border-transparent bg-white hover:bg-[rgb(var(--fe-surface))]',
                      isActive ? 'shadow-[inset_3px_0_0_rgb(var(--fe-accent))]' : 'shadow-[inset_3px_0_0_transparent]',
                    ].join(' ')}
                  >
                    <div
                      className={[
                        'flex h-8 w-8 shrink-0 items-center justify-center rounded-(--fe-radius) text-xs font-semibold',
                        isSelected ? 'bg-[rgba(var(--fe-accent),0.16)] text-[rgb(var(--fe-accent))]' : 'bg-[rgb(var(--fe-surface))] text-[rgb(var(--fe-muted))]',
                      ].join(' ')}
                      aria-hidden="true"
                    >
                      {getCafeMonogram(cafe)}
                    </div>
                    <div className="min-w-0">
                      <div className="truncate text-sm font-semibold text-[rgb(var(--fe-text))]">{getCafeLabel(cafe)}</div>
                    </div>
                    {isSelected ? (
                      <div className="ml-auto shrink-0 text-sm font-semibold text-[rgb(var(--fe-accent))]" aria-hidden="true">
                        ✓
                      </div>
                    ) : null}
                  </button>
                )
              })}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  )
}

