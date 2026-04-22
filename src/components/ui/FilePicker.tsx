import { useId, useMemo, useState } from 'react'

type Props = {
  accept?: string
  disabled?: boolean
  buttonText: string
  hint?: string
  hideMeta?: boolean
  onPick: (file: File) => Promise<void> | void
}

export function FilePicker({ accept = 'image/*', disabled, buttonText, hint, hideMeta = false, onPick }: Props) {
  const inputId = useId()
  const [fileName, setFileName] = useState<string>('')

  const labelClassName = useMemo(() => {
    const base =
      'inline-flex items-center justify-center rounded-(--fe-radius) border px-3 py-2 text-xs font-semibold transition-colors'
    if (disabled) return `${base} cursor-not-allowed border-[rgb(var(--fe-line))] bg-[rgb(var(--fe-surface))] text-[rgb(var(--fe-muted))]`
    return `${base} border-[rgb(var(--fe-line))] bg-white text-[rgb(var(--fe-text))] hover:bg-[rgb(var(--fe-surface))]`
  }, [disabled])

  return (
    <div className="flex flex-col gap-2">
      <input
        id={inputId}
        type="file"
        accept={accept}
        className="sr-only"
        disabled={disabled}
        onChange={async (e) => {
          const file = e.target.files?.[0]
          if (!file) return
          setFileName(file.name)
          try {
            await onPick(file)
          } finally {
            e.target.value = ''
          }
        }}
      />
      <div className="flex items-center gap-2">
        <label htmlFor={inputId} className={labelClassName}>
          {buttonText}
        </label>
        {!hideMeta ? (
          <div className="min-w-0 flex-1 truncate text-xs text-[rgb(var(--fe-muted))]">
            {fileName || hint || 'Chưa chọn tệp'}
          </div>
        ) : null}
      </div>
    </div>
  )
}

