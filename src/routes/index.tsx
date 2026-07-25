import { createFileRoute, redirect } from '@tanstack/react-router'

import { DEFAULT_LOCALE } from '@/i18n/locale'
import { resolveLocale } from '@/i18n/resolve-locale'

/**
 * Bare `/` — resolves the locale and redirects (CLAUDE.md §11).
 *
 * **302, not 301.** A permanent redirect would be cached by the browser
 * effectively forever, which would pin a reader to whichever language they
 * happened to arrive in first and make the switcher useless on the home page.
 * Language preference has to stay changeable.
 *
 * There is no component: this route only ever redirects.
 */
export const Route = createFileRoute('/')({
  beforeLoad: () => {
    throw redirect({
      to: '/$locale',
      params: { locale: resolveLocale() ?? DEFAULT_LOCALE },
      statusCode: 302,
    })
  },
})
