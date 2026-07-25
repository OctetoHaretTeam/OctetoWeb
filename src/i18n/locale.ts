/**
 * Locale primitives — CLAUDE.md §11.
 *
 * Romanian is the default and the team's own language. English is what
 * international judges and sponsors read. Both are first-class; neither is a
 * translation layer over the other.
 *
 * Everything in this file is pure and client-safe. Request-bound resolution
 * (cookie, Accept-Language) lives in `locale.server.ts`.
 */

export const LOCALES = ['ro', 'en'] as const

export type Locale = (typeof LOCALES)[number]

/** Falls back to Romanian when no cookie and no Accept-Language match (§11). */
export const DEFAULT_LOCALE: Locale = 'ro'

/**
 * One of only two cookies the site sets (§8). Strictly necessary, so no
 * consent banner is required — keep it that way.
 */
export const LOCALE_COOKIE = 'locale'

/** BCP 47 tags, for `<html lang>`, `hreflang` and `Intl` formatting. */
export const LOCALE_TAGS: Record<Locale, string> = {
  ro: 'ro-MD',
  en: 'en',
}

/** `og:locale` values (§11). */
export const OG_LOCALES: Record<Locale, string> = {
  ro: 'ro_MD',
  en: 'en_US',
}

/** What each option says in the switcher. Text, never flags (§11). */
export const LOCALE_LABELS: Record<Locale, string> = {
  ro: 'RO',
  en: 'EN',
}

export function isLocale(value: unknown): value is Locale {
  return (
    typeof value === 'string' && (LOCALES as readonly string[]).includes(value)
  )
}

/** The other locale — used to build the language switcher's target href. */
export function otherLocale(locale: Locale): Locale {
  return locale === 'ro' ? 'en' : 'ro'
}

/**
 * Reads the locale out of a pathname, or null when the path is not
 * locale-prefixed (`/q/…`, `/admin/…`, `/styleguide`).
 */
export function localeFromPathname(pathname: string): Locale | null {
  const segment = pathname.split('/')[1]
  return isLocale(segment) ? segment : null
}

/** Drops a leading locale segment, returning the path without it. */
export function stripLocale(pathname: string): string {
  const locale = localeFromPathname(pathname)
  if (!locale) return normalize(pathname)
  const rest = pathname.slice(locale.length + 1)
  return normalize(rest)
}

/**
 * Returns the equivalent path in another locale.
 *
 * This is what makes the switcher land on the same page rather than the home
 * page (§11) — `/ro/team/andrei` becomes `/en/team/andrei`. Slugs are NOT
 * localised: one slug serves both locales, because slugs are printed on
 * merchandise.
 */
export function withLocale(pathname: string, locale: Locale): string {
  const rest = stripLocale(pathname)
  return rest === '/' ? `/${locale}` : `/${locale}${rest}`
}

/**
 * Picks the best supported locale from an `Accept-Language` header.
 *
 * Quality values are honoured, and a regional tag matches its base language so
 * `ro-RO` and `en-GB` both resolve. Returns null when nothing matches, leaving
 * the caller to apply the default.
 */
export function parseAcceptLanguage(
  header: string | null | undefined,
): Locale | null {
  if (!header) return null

  const candidates = header
    .split(',')
    .map((part) => {
      const [tag, ...params] = part.trim().split(';')
      const q = params
        .map((p) => p.trim())
        .find((p) => p.startsWith('q='))
        ?.slice(2)
      const quality = q === undefined ? 1 : Number.parseFloat(q)
      return {
        tag: (tag ?? '').trim().toLowerCase(),
        quality: Number.isFinite(quality) ? quality : 0,
      }
    })
    .filter((c) => c.tag.length > 0 && c.quality > 0)
    .sort((a, b) => b.quality - a.quality)

  for (const { tag } of candidates) {
    if (tag === '*') return DEFAULT_LOCALE
    const base = tag.split('-')[0]
    if (isLocale(base)) return base
  }

  return null
}

function normalize(pathname: string): string {
  if (!pathname.startsWith('/')) return `/${pathname}`
  return pathname === '' ? '/' : pathname
}
