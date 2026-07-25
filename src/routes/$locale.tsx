import { Outlet, createFileRoute, redirect } from '@tanstack/react-router'

import { SiteHeader } from '@/components/site-header'
import { getDictionary } from '@/i18n/dictionaries'
import {
  DEFAULT_LOCALE,
  LOCALES,
  LOCALE_TAGS,
  OG_LOCALES,
  isLocale,
  otherLocale,
  withLocale,
} from '@/i18n/locale'
import { persistLocalePreference, resolveLocale } from '@/i18n/resolve-locale'
import { absoluteUrl } from '@/lib/site'

/**
 * The locale layout — every public route lives under it (CLAUDE.md §11).
 *
 * It does three jobs: rejects a path whose first segment is not a locale,
 * persists the reader's choice, and emits the per-page `hreflang` alternates
 * and `og:locale` tags.
 */
export const Route = createFileRoute('/$locale')({
  beforeLoad: ({ params, location }) => {
    if (!isLocale(params.locale)) {
      // Not a locale — most likely an unprefixed link such as `/team/andrei`,
      // which is also the shape QR targets are stored in (§6). Send it to the
      // reader's own language rather than 404, and use 302 so the choice stays
      // changeable.
      throw redirect({
        href: `${withLocale(location.pathname, resolveLocale() ?? DEFAULT_LOCALE)}${location.searchStr}`,
        statusCode: 302,
      })
    }

    // Visiting /en is itself the choice — remember it (§11).
    persistLocalePreference(params.locale)

    return { locale: params.locale }
  },

  head: ({ params, matches }) => {
    const locale = isLocale(params.locale) ? params.locale : DEFAULT_LOCALE
    const dictionary = getDictionary(locale)

    // Route pathnames arrive with a trailing slash (`/en/`) while `withLocale`
    // normalises it away. Building the canonical URL through `withLocale` too
    // keeps canonical and alternates byte-identical — a mismatch between them
    // is exactly the kind of thing that quietly splits ranking signals.
    const rawPathname = matches[matches.length - 1]?.pathname ?? `/${locale}`
    const pathname = withLocale(rawPathname, locale)

    return {
      meta: [
        { name: 'description', content: dictionary.site.tagline },
        { property: 'og:site_name', content: dictionary.site.name },
        { property: 'og:type', content: 'website' },
        { property: 'og:url', content: absoluteUrl(pathname) },
        { property: 'og:locale', content: OG_LOCALES[locale] },
        {
          property: 'og:locale:alternate',
          content: OG_LOCALES[otherLocale(locale)],
        },
      ],
      links: [
        { rel: 'canonical', href: absoluteUrl(pathname) },
        // One alternate per locale, plus x-default pointing at Romanian —
        // the team's own language and the site default.
        ...LOCALES.map((alternate) => ({
          rel: 'alternate',
          hrefLang: LOCALE_TAGS[alternate],
          href: absoluteUrl(withLocale(pathname, alternate)),
        })),
        {
          rel: 'alternate',
          hrefLang: 'x-default',
          href: absoluteUrl(withLocale(pathname, DEFAULT_LOCALE)),
        },
      ],
    }
  },

  component: LocaleLayout,
})

function LocaleLayout() {
  return (
    <div className="bg-branch-ground text-branch-text min-h-screen">
      <SiteHeader />
      <Outlet />
    </div>
  )
}
