import {
  getCookie,
  getRequestHeader,
  setCookie,
} from '@tanstack/react-start/server'

import {
  DEFAULT_LOCALE,
  LOCALE_COOKIE,
  type Locale,
  isLocale,
  parseAcceptLanguage,
} from './locale'

/**
 * Request-bound locale resolution — CLAUDE.md §11.
 *
 * `.server.ts` is denied in the client bundle by TanStack Start's import
 * protection, so nothing here can leak into what a browser downloads.
 */

/**
 * The resolution order the whole site depends on: the `locale` cookie, then
 * `Accept-Language`, then Romanian.
 *
 * This is also what the QR resolver uses (§6). A judge at an international
 * event scanning a shirt should land on English without touching the toggle,
 * which is the single highest-value place the language system pays off.
 */
export function resolveRequestLocale(): Locale {
  const cookie = getCookie(LOCALE_COOKIE)
  if (isLocale(cookie)) return cookie

  return parseAcceptLanguage(getRequestHeader('accept-language')) ?? DEFAULT_LOCALE
}

/**
 * Persists the reader's choice the moment they switch (§11).
 *
 * Not `httpOnly`: this is a preference, not a credential, and there is no harm
 * in the client reading it. It is one of only two cookies the site sets, both
 * strictly necessary, so no consent banner is required (§8) — do not add a
 * third without revisiting that.
 */
export function persistLocale(locale: Locale): void {
  setCookie(LOCALE_COOKIE, locale, {
    path: '/',
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    httpOnly: false,
    maxAge: 60 * 60 * 24 * 365,
  })
}
