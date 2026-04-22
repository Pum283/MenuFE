type Props = {
  header: React.ReactNode
  children: React.ReactNode
}

export function Table({ header, children }: Props) {
  return (
    <div className="overflow-hidden rounded-(--fe-radius) border border-[rgb(var(--fe-line))] bg-white">
      <div className="overflow-x-auto">
        <table className="min-w-full border-separate border-spacing-0 text-left text-sm">
          <thead className="bg-[rgb(var(--fe-surface))] text-xs font-semibold text-[rgb(var(--fe-muted))]">
            {header}
          </thead>
          <tbody className="text-[rgb(var(--fe-text))]">{children}</tbody>
        </table>
      </div>
    </div>
  )
}

export function Th({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <th className={['whitespace-nowrap border-b border-[rgb(var(--fe-line))] px-4 py-3', className ?? ''].join(' ')}>
      {children}
    </th>
  )
}

export function Td({
  children,
  colSpan,
  className,
}: {
  children: React.ReactNode
  colSpan?: number
  className?: string
}) {
  return (
    <td
      colSpan={colSpan}
      className={['border-b border-[rgb(var(--fe-line))] px-4 py-3 align-middle', className ?? ''].join(' ')}
    >
      {children}
    </td>
  )
}

