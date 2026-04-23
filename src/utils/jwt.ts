export type JwtPayload = Record<string, unknown>

function base64UrlDecode(input: string) {
  const padded = input.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(input.length / 4) * 4, '=')
  const decoded = atob(padded)
  return decoded
}

export function decodeJwtPayload(token: string): JwtPayload | null {
  const parts = token.split('.')
  if (parts.length < 2) return null
  try {
    const json = base64UrlDecode(parts[1] ?? '')
    const parsed = JSON.parse(json) as JwtPayload
    return parsed && typeof parsed === 'object' ? parsed : null
  } catch {
    return null
  }
}

