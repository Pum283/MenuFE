import { getAdminLang } from '../constants/lang'

type Money = {
  amount: number
  currency: string
}

function toLocale(lang: 'vi' | 'en') {
  return lang === 'en' ? 'en-US' : 'vi-VN'
}

function normalizeCurrency(currency: string) {
  const c = currency.trim().toUpperCase()
  return c || 'VND'
}

export function formatMoney({ amount, currency }: Money) {
  const lang = getAdminLang()
  const locale = toLocale(lang)
  const cur = normalizeCurrency(currency)

  const formatted = new Intl.NumberFormat(locale, {
    style: 'decimal',
    maximumFractionDigits: 2,
  }).format(amount)

  return `${formatted} ${cur}`
}

