import type { CafeDto } from '../types/api'
import { decodeJwtPayload } from './jwt'

type CafeClaim =
  | string
  | {
      id?: unknown
      cafeId?: unknown
      code?: unknown
      cafeCode?: unknown
      name?: unknown
      cafeName?: unknown
    }

function asString(v: unknown) {
  return typeof v === 'string' ? v : null
}

function normalizeCafeClaimToCafeDto(claim: CafeClaim): CafeDto | null {
  if (typeof claim === 'string') {
    const id = claim.trim()
    if (!id) return null
    return { id, code: id, name: id, isActive: true }
  }

  const id = asString(claim.id) ?? asString(claim.cafeId)
  if (!id?.trim()) return null
  const code = asString(claim.code) ?? asString(claim.cafeCode) ?? id
  const name = asString(claim.name) ?? asString(claim.cafeName) ?? code
  return { id, code, name, isActive: true }
}

export function getBrandCafesFromAccessToken(token: string | null): CafeDto[] {
  if (!token) return []
  const payload = decodeJwtPayload(token)
  if (!payload) return []

  const candidates: unknown[] = []

  for (const key of ['cafes', 'cafeMemberships', 'cafe_memberships', 'cafeIds', 'cafe_ids', 'cafeId', 'cafe_id']) {
    const v = payload[key]
    if (!v) continue
    candidates.push(v)
  }

  // Flatten common shapes
  const flattened: CafeClaim[] = []
  for (const v of candidates) {
    if (Array.isArray(v)) {
      for (const x of v) flattened.push(x as CafeClaim)
      continue
    }
    flattened.push(v as CafeClaim)
  }

  const cafes = flattened.map(normalizeCafeClaimToCafeDto).filter(Boolean) as CafeDto[]
  const byId = new Map<string, CafeDto>()
  for (const c of cafes) {
    if (!byId.has(c.id)) byId.set(c.id, c)
  }
  return Array.from(byId.values())
}

