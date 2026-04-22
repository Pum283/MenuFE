type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'danger'
}

export function Button({ variant = 'primary', className, ...rest }: Props) {
  const base =
    'inline-flex items-center justify-center rounded-(--fe-radius) px-4 py-3 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-60'

  const styles =
    variant === 'primary'
      ? 'bg-[rgb(var(--fe-text))] text-white hover:bg-black'
      : variant === 'danger'
        ? 'bg-red-600 text-white hover:bg-red-700'
        : 'border border-[rgb(var(--fe-line))] bg-white text-[rgb(var(--fe-text))] hover:bg-[rgb(var(--fe-surface))]'

  return <button {...rest} className={[base, styles, className ?? ''].join(' ')} />
}

