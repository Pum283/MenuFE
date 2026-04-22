import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { UI_TEXT } from '../constants/uiText'
import { login } from '../utils/api'
import { useAuthContext } from '../components/auth/AuthProvider'
import { useToast } from '../components/ui/Toast'

export function LoginPage() {
  const auth = useAuthContext()
  const navigate = useNavigate()
  const toast = useToast()

  const [email, setEmail] = useState<string>('admin@gmail.com')
  const [password, setPassword] = useState<string>('Ndmhung6@')
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false)

  const canSubmit = useMemo(() => email.trim() && password.trim() && !isSubmitting, [email, password, isSubmitting])

  return (
    <div className="min-h-dvh">
      <div className="mx-auto flex min-h-dvh w-full max-w-md items-center px-5 py-10">
        <div className="w-full rounded-(--fe-radius) border border-[rgb(var(--fe-line))] bg-white p-6 shadow-[0_25px_80px_rgba(0,0,0,0.10)]">
          <div className="text-center">
            <div className="text-sm font-semibold tracking-wide text-[rgb(var(--fe-muted))]">{UI_TEXT.appName}</div>
            <div className="mt-2 text-2xl font-semibold tracking-tight text-[rgb(var(--fe-text))]">
              {UI_TEXT.loginTitle}
            </div>
          </div>

          <form
            className="mt-8 space-y-4"
            onSubmit={async (e) => {
              e.preventDefault()
              if (!canSubmit) return
              setIsSubmitting(true)
              try {
                const res = await login({ email, password })
                auth.signIn(res)
                toast.success('Đăng nhập thành công.')
                navigate('/')
              } catch (err) {
                toast.error(err instanceof Error ? err.message : 'Đăng nhập thất bại')
              } finally {
                setIsSubmitting(false)
              }
            }}
          >
            <label className="block">
              <div className="text-sm font-semibold text-[rgb(var(--fe-muted))]">{UI_TEXT.email}</div>
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-2 w-full rounded-(--fe-radius) border border-[rgb(var(--fe-line))] bg-white px-4 py-3 text-sm text-[rgb(var(--fe-text))] focus:outline-2 focus:outline-offset-2 focus:outline-[rgb(var(--fe-accent))]"
                autoComplete="email"
              />
            </label>

            <label className="block">
              <div className="text-sm font-semibold text-[rgb(var(--fe-muted))]">{UI_TEXT.password}</div>
              <input
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                type="password"
                className="mt-2 w-full rounded-(--fe-radius) border border-[rgb(var(--fe-line))] bg-white px-4 py-3 text-sm text-[rgb(var(--fe-text))] focus:outline-2 focus:outline-offset-2 focus:outline-[rgb(var(--fe-accent))]"
                autoComplete="current-password"
              />
            </label>

            <button
              type="submit"
              disabled={!canSubmit}
              className="w-full rounded-(--fe-radius) bg-[rgb(var(--fe-text))] px-4 py-3 text-sm font-semibold text-white hover:bg-black disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? 'Đang đăng nhập...' : UI_TEXT.signIn}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

