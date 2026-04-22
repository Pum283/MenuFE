export type ApiMessage = {
  message?: string
  error?: string
}

export type CafeDto = {
  id: string
  code: string
  name: string
  logoUrl?: string | null
  heroImageUrl?: string | null
  isActive: boolean
}

export type UpsertCafeRequest = {
  code: string
  translations: {
    vi: { name: string }
    en: { name: string }
  }
  isActive: boolean
}

export type MenuCategoryDto = {
  id: string
  cafeId: string
  slug: string
  name: string
  description?: string | null
  displayOrder: number
  isActive: boolean
}

export type UpsertMenuCategoryRequest = {
  slug: string
  translations: {
    vi: { name: string; description?: string | null }
    en: { name: string; description?: string | null }
  }
  displayOrder: number
  isActive: boolean
}

export type MenuItemDto = {
  id: string
  cafeId: string
  categoryId: string
  slug: string
  name: string
  description?: string | null
  imageUrl?: string | null
  basePrice?: number | null
  currency: string
  displayOrder: number
  isActive: boolean
}

export type UpsertMenuItemRequest = {
  categoryId: string
  slug: string
  translations: {
    vi: { name: string; description?: string | null }
    en: { name: string; description?: string | null }
  }
  basePrice?: number | null
  currency: string
  displayOrder: number
  isActive: boolean
}

export type CreateUserRequest = {
  email: string
  password: string
  roleCode: 'admin' | 'brand'
}

export type BlockUserRequest = {
  isBlocked: boolean
  reason?: string | null
}

export type AssignCafeMemberRequest = {
  cafeId: string
  userId: string
  isBlocked: boolean
  reason?: string | null
}

