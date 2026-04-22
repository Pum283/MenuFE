import { STORAGE_KEYS } from './storageKeys'

export type AdminLang = 'vi' | 'en'

export const DEFAULT_ADMIN_LANG: AdminLang = 'vi'

export function getAdminLang(): AdminLang {
  const raw = localStorage.getItem(STORAGE_KEYS.adminLang)
  return raw === 'en' ? 'en' : 'vi'
}

export function setAdminLang(lang: AdminLang) {
  localStorage.setItem(STORAGE_KEYS.adminLang, lang)
}

