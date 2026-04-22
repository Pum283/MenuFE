type Props = React.InputHTMLAttributes<HTMLInputElement>

export function Input(props: Props) {
  return (
    <input
      {...props}
      className={[
        'w-full rounded-(--fe-radius) border border-[rgb(var(--fe-line))] bg-white px-4 py-3 text-sm text-[rgb(var(--fe-text))]',
        'focus:outline-2 focus:outline-offset-2 focus:outline-[rgb(var(--fe-accent))]',
        props.className ?? '',
      ].join(' ')}
    />
  )
}

