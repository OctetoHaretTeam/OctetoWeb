import { createIsomorphicFn } from '@tanstack/react-start'

import { LOCALE_COOKIE, type Locale, cookieValue, pickLocale } from './locale'
import { persistLocale, resolveRequestLocale } from './locale.server'

/**
 * Resolves the reader's locale in either environment — CLAUDE.md §11.
 *
 * On the server this reads the `locale` cookie, then `Accept-Language`, then
 * falls back to Romanian. On the client (a soft navigation to `/`) there is no
 * request to read, so it uses the cookie the server already set and then the
 * browser's language list.
 *
 * `createIsomorphicFn` keeps the server branch — and the `.server.ts` import
 * it depends on — out of the client bundle.
 */
export const resolveLocale = createIsomorphicFn()
  .server((): Locale => resolveRequestLocale())
  .client(
    (): Locale =>
      pickLocale(
        cookieValue(document.cookie, LOCALE_COOKIE),
        navigator.languages?.join(',') ?? navigator.language,
      ),
  )

/**
 * Writes the `locale` cookie so the choice survives the next visit — including
 * a QR scan, which is the case that matters most (§6).
 *
 * Server-only by design. On the client this is a no-op: the cookie arrives on
 * the response of the full navigation the switcher performs, so there is
 * nothing for the browser to do.
 */
export const persistLocalePreference = createIsomorphicFn().server(
  (locale: Locale): void => persistLocale(locale),
)
