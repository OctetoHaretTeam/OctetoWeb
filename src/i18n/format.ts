import { LOCALE_TAGS, type Locale } from './locale'

/**
 * Locale-aware formatting via `Intl` — CLAUDE.md §11.
 *
 * Money is always Moldovan lei; the locale changes how it is written, not what
 * it is. Formatters are cached because constructing `Intl.*` is comparatively
 * expensive and these run per row on list pages.
 */

const CURRENCY = 'MDL'

const dateCache = new Map<string, Intl.DateTimeFormat>()
const numberCache = new Map<string, Intl.NumberFormat>()

function dateFormatter(
  locale: Locale,
  options: Intl.DateTimeFormatOptions,
): Intl.DateTimeFormat {
  const key = `${locale}:${JSON.stringify(options)}`
  let formatter = dateCache.get(key)
  if (!formatter) {
    formatter = new Intl.DateTimeFormat(LOCALE_TAGS[locale], options)
    dateCache.set(key, formatter)
  }
  return formatter
}

function numberFormatter(
  locale: Locale,
  options: Intl.NumberFormatOptions,
): Intl.NumberFormat {
  const key = `${locale}:${JSON.stringify(options)}`
  let formatter = numberCache.get(key)
  if (!formatter) {
    formatter = new Intl.NumberFormat(LOCALE_TAGS[locale], options)
    numberCache.set(key, formatter)
  }
  return formatter
}

/**
 * Accepts the `YYYY-MM-DD` strings Drizzle returns for `date` columns as well
 * as `Date` objects. A bare date string is parsed as UTC so it cannot shift a
 * day backwards for readers west of the meridian.
 */
export function toDate(value: string | Date): Date {
  if (value instanceof Date) return value
  return /^\d{4}-\d{2}-\d{2}$/.test(value)
    ? new Date(`${value}T00:00:00Z`)
    : new Date(value)
}

export function formatDate(
  value: string | Date,
  locale: Locale,
  options: Intl.DateTimeFormatOptions = {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  },
): string {
  return dateFormatter(locale, options).format(toDate(value))
}

/** Month and year only — for season spans and archive headings. */
export function formatMonthYear(value: string | Date, locale: Locale): string {
  return formatDate(value, locale, {
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  })
}

export function formatNumber(
  value: number,
  locale: Locale,
  options: Intl.NumberFormatOptions = {},
): string {
  return numberFormatter(locale, options).format(value)
}

/** Moldovan lei, written the way the active locale writes currency. */
export function formatCurrency(
  amount: number,
  locale: Locale,
  options: Intl.NumberFormatOptions = {},
): string {
  return numberFormatter(locale, {
    style: 'currency',
    currency: CURRENCY,
    maximumFractionDigits: 0,
    ...options,
  }).format(amount)
}

/**
 * Compact form for the home stats row, where space is tight and the exact
 * figure matters less than the order of magnitude.
 */
export function formatCompact(value: number, locale: Locale): string {
  return numberFormatter(locale, {
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(value)
}

/** `datetime` attribute for a `<time>` element. Always ISO, never localised. */
export function toIsoDate(value: string | Date): string {
  return toDate(value).toISOString().slice(0, 10)
}
