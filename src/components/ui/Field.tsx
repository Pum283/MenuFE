type Props = {
  label: string
  children: React.ReactNode
  hint?: string
}

export function Field({ label, children, hint }: Props) {
  return (
    <label className="block">
      <div className="text-sm font-semibold text-[rgb(var(--fe-muted))]">{label}</div>
      <div className="mt-2">{children}</div>
      {hint ? <div className="mt-2 text-xs text-[rgb(var(--fe-muted))]">{hint}</div> : null}
    </label>
  )
}

