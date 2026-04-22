type Props = {
  title: string
  description?: string
  right?: React.ReactNode
  children: React.ReactNode
}

export function Card({ title, description, right, children }: Props) {
  return (
    <section className="rounded-(--fe-radius) border border-[rgb(var(--fe-line))] bg-white px-5 py-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-lg font-semibold text-[rgb(var(--fe-text))]">{title}</div>
          {description ? <div className="mt-2 text-sm text-[rgb(var(--fe-muted))]">{description}</div> : null}
        </div>
        {right ? <div className="shrink-0">{right}</div> : null}
      </div>
      <div className="mt-5">{children}</div>
    </section>
  )
}

