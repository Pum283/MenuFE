import type { LoginRequest, LoginResponse } from '../types/auth'
import type {
  AssignCafeMemberRequest,
  BlockUserRequest,
  CafeDto,
  CreateUserRequest,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  MenuCategoryDto,
  MenuItemDto,
  UpsertCafeRequest,
  UpsertMenuCategoryRequest,
  UpsertMenuItemRequest,
} from '../types/api'
import type { RoleCode } from '../types/auth'
import { getAdminLang } from '../constants/lang'

export type AdminUserCafeMembershipDto = {
  cafeId: string
  cafeCode: string
  cafeName: string
  status: string
}

export type AdminUserDto = {
  id: string
  email: string
  status: 'active' | 'blocked' | string
  roles: RoleCode[]
  cafeMemberships: AdminUserCafeMembershipDto[]
}

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? ''

export class ApiError extends Error {
  public status: number
  public payload?: unknown

  constructor(message: string, status: number, payload?: unknown) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.payload = payload
  }
}

function getAuthHeader(): Record<string, string> {
  const token = localStorage.getItem('MENUFE_ACCESS_TOKEN')
  return token ? { Authorization: `Bearer ${token}` } : {}
}

type LangOverride = 'vi' | 'en'

async function requestJson<T>(path: string, init: RequestInit, signal?: AbortSignal, langOverride?: LangOverride): Promise<T> {
  const lang = langOverride ?? getAdminLang()
  const base = API_BASE_URL.trim() ? API_BASE_URL.trim() : window.location.origin
  const url = new URL(path, base)
  url.searchParams.set('lang', lang)

  const res = await fetch(url.toString(), {
    ...init,
    signal,
    headers: {
      Accept: 'application/json',
      ...(init.headers ?? {}),
      ...getAuthHeader(),
    },
  })

  const text = await res.text()
  let payload: unknown = undefined
  if (text) {
    try {
      payload = JSON.parse(text) as unknown
    } catch {
      payload = text
    }
  }

  if (!res.ok) {
    const message =
      typeof payload === 'object' && payload && ('error' in payload || 'message' in payload)
        ? String(
            ((payload as { error?: unknown; message?: unknown }).error ??
              (payload as { error?: unknown; message?: unknown }).message ??
              'Request failed') as unknown,
          )
        : typeof payload === 'string' && payload.trim()
          ? payload
          : `Request failed (${res.status})`
    throw new ApiError(message, res.status, payload)
  }

  return payload as T
}

export async function login(body: LoginRequest, signal?: AbortSignal): Promise<LoginResponse> {
  return await requestJson<LoginResponse>(
    '/api/auth/login',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    },
    signal,
  )
}

export async function getCafes(signal?: AbortSignal): Promise<CafeDto[]> {
  return await requestJson<CafeDto[]>('/api/admincafes', { method: 'GET' }, signal)
}

export async function getCafesByLang(lang: LangOverride, signal?: AbortSignal): Promise<CafeDto[]> {
  return await requestJson<CafeDto[]>('/api/admincafes', { method: 'GET' }, signal, lang)
}

/**
 * Brand: danh sách quán được gán cho user hiện tại.
 *
 * Backend contract (đồng bộ với pattern hiện có):
 * - GET /api/brandcafes?lang=vi|en
 * - Response: CafeDto[]
 */
export async function getBrandCafes(signal?: AbortSignal): Promise<CafeDto[]> {
  return await requestJson<CafeDto[]>('/api/brandcafes', { method: 'GET' }, signal)
}

export async function getBrandCafesByLang(lang: LangOverride, signal?: AbortSignal): Promise<CafeDto[]> {
  return await requestJson<CafeDto[]>('/api/brandcafes', { method: 'GET' }, signal, lang)
}

export async function createCafe(body: UpsertCafeRequest, signal?: AbortSignal): Promise<CafeDto> {
  return await requestJson<CafeDto>(
    '/api/admincafes',
    { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) },
    signal,
  )
}

export async function updateCafe(id: string, body: UpsertCafeRequest, signal?: AbortSignal): Promise<CafeDto> {
  return await requestJson<CafeDto>(
    `/api/admincafes/${id}`,
    { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) },
    signal,
  )
}

export async function uploadCafeLogo(cafeId: string, file: File, signal?: AbortSignal): Promise<unknown> {
  const form = new FormData()
  form.append('file', file)
  return await requestJson<unknown>(`/api/media/cafes/${cafeId}/logo`, { method: 'PUT', body: form }, signal)
}

export async function uploadCafeHero(cafeId: string, file: File, signal?: AbortSignal): Promise<unknown> {
  const form = new FormData()
  form.append('file', file)
  return await requestJson<unknown>(`/api/media/cafes/${cafeId}/hero`, { method: 'PUT', body: form }, signal)
}

export async function getMenuCategories(cafeId: string, signal?: AbortSignal): Promise<MenuCategoryDto[]> {
  return await requestJson<MenuCategoryDto[]>(`/api/menu/${cafeId}/categories`, { method: 'GET' }, signal)
}

export async function getMenuCategoriesByLang(
  cafeId: string,
  lang: LangOverride,
  signal?: AbortSignal,
): Promise<MenuCategoryDto[]> {
  return await requestJson<MenuCategoryDto[]>(`/api/menu/${cafeId}/categories`, { method: 'GET' }, signal, lang)
}

export async function createMenuCategory(
  cafeId: string,
  body: UpsertMenuCategoryRequest,
  signal?: AbortSignal,
): Promise<MenuCategoryDto> {
  return await requestJson<MenuCategoryDto>(
    `/api/menu/${cafeId}/categories`,
    { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) },
    signal,
  )
}

export async function updateMenuCategory(
  cafeId: string,
  categoryId: string,
  body: UpsertMenuCategoryRequest,
  signal?: AbortSignal,
): Promise<MenuCategoryDto> {
  return await requestJson<MenuCategoryDto>(
    `/api/menu/${cafeId}/categories/${categoryId}`,
    { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) },
    signal,
  )
}

export async function deleteMenuCategory(cafeId: string, categoryId: string, signal?: AbortSignal): Promise<unknown> {
  return await requestJson<unknown>(`/api/menu/${cafeId}/categories/${categoryId}`, { method: 'DELETE' }, signal)
}

export async function getMenuItems(
  cafeId: string,
  categoryId?: string,
  signal?: AbortSignal,
): Promise<MenuItemDto[]> {
  const query = categoryId ? `?categoryId=${encodeURIComponent(categoryId)}` : ''
  return await requestJson<MenuItemDto[]>(`/api/menu/${cafeId}/items${query}`, { method: 'GET' }, signal)
}

export async function getMenuItemsByLang(
  cafeId: string,
  lang: LangOverride,
  categoryId?: string,
  signal?: AbortSignal,
): Promise<MenuItemDto[]> {
  const query = categoryId ? `?categoryId=${encodeURIComponent(categoryId)}` : ''
  return await requestJson<MenuItemDto[]>(`/api/menu/${cafeId}/items${query}`, { method: 'GET' }, signal, lang)
}

export async function createMenuItem(
  cafeId: string,
  body: UpsertMenuItemRequest,
  signal?: AbortSignal,
): Promise<MenuItemDto> {
  return await requestJson<MenuItemDto>(
    `/api/menu/${cafeId}/items`,
    { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) },
    signal,
  )
}

export async function updateMenuItem(
  cafeId: string,
  itemId: string,
  body: UpsertMenuItemRequest,
  signal?: AbortSignal,
): Promise<MenuItemDto> {
  return await requestJson<MenuItemDto>(
    `/api/menu/${cafeId}/items/${itemId}`,
    { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) },
    signal,
  )
}

export async function deleteMenuItem(cafeId: string, itemId: string, signal?: AbortSignal): Promise<unknown> {
  return await requestJson<unknown>(`/api/menu/${cafeId}/items/${itemId}`, { method: 'DELETE' }, signal)
}

export async function uploadMenuItemImage(itemId: string, file: File, signal?: AbortSignal): Promise<unknown> {
  const form = new FormData()
  form.append('file', file)
  return await requestJson<unknown>(`/api/media/menu-items/${itemId}/image`, { method: 'PUT', body: form }, signal)
}

export async function adminCreateUser(body: CreateUserRequest, signal?: AbortSignal): Promise<unknown> {
  return await requestJson<unknown>(
    '/api/adminusers',
    { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) },
    signal,
  )
}

export async function adminGetUsers(q?: string, signal?: AbortSignal): Promise<AdminUserDto[]> {
  const query = q?.trim() ? `?q=${encodeURIComponent(q.trim())}` : ''
  return await requestJson<AdminUserDto[]>(`/api/adminusers${query}`, { method: 'GET' }, signal)
}

export async function adminBlockUser(userId: string, body: BlockUserRequest, signal?: AbortSignal): Promise<unknown> {
  return await requestJson<unknown>(
    `/api/adminusers/${userId}/block`,
    { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) },
    signal,
  )
}

export async function adminUpsertCafeMember(body: AssignCafeMemberRequest, signal?: AbortSignal): Promise<unknown> {
  return await requestJson<unknown>(
    '/api/adminusers/memberships',
    { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) },
    signal,
  )
}

