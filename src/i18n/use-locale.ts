import { useRouterState } from '@tanstack/react-router'

import { type Dictionary, getDictionary } from './dictionaries'
import { DEFAULT_LOCALE, type Locale, localeFromPathname } from './locale'

/**
 * The active locale, read from the URL.
 *
 * Deliberately derived from the pathname rather than from route context, so it
 * also works in `__root.tsx` — which renders the `<html lang>` attribute but
 * sits above the `/$locale` route that owns the param.
 *
 * Unprefixed routes (`/q/…`, `/admin/…`, `/styleguide`) fall back to Romanian.
 */
export function useLocale(): Locale {
  const pathname = useRouterState({ select: (s) => s.location.pathname })
  return localeFromPathname(pathname) ?? DEFAULT_LOCALE
}

/** UI strings for the active locale. */
export function useDictionary(): Dictionary {
  return getDictionary(useLocale())
}

/** The current pathname and query string, for building switcher links. */
export function useCurrentPath(): { pathname: string; search: string } {
  return useRouterState({
    select: (s) => ({
      pathname: s.location.pathname,
      search: s.location.searchStr,
    }),
  })
}
