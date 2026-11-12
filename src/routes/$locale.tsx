import { Outlet, createFileRoute, redirect } from '@tanstack/react-router'

import { SiteFooter } from '@/components/site-footer'
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
import { useDictionary, useLocale } from '@/i18n/use-locale'
import {
  SEO_KEYWORDS,
  absoluteUrl,
  buildSiteJsonLd,
} from '@/lib/site'
import { getContactInfo } from '@/server/contact'

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

  // Loaded once at the layout, not per page: the footer is on every route, so
  // fetching it lower down would repeat the same singleton query on every
  // navigation instead of resolving with the layout that owns it.
  loader: () => getContactInfo(),

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
        { name: 'keywords', content: SEO_KEYWORDS[locale] },
        { property: 'og:site_name', content: dictionary.site.name },
        { property: 'og:type', content: 'website' },
        { property: 'og:url', content: absoluteUrl(pathname) },
        { property: 'og:image', content: absoluteUrl('/logo.webp') },
        { property: 'og:image:alt', content: 'OctetoHaret — FTC #25474' },
        { property: 'og:locale', content: OG_LOCALES[locale] },
        {
          property: 'og:locale:alternate',
          content: OG_LOCALES[otherLocale(locale)],
        },
        { name: 'twitter:card', content: 'summary_large_image' },
        { name: 'twitter:image', content: absoluteUrl('/logo.webp') },
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
  const contact = Route.useLoaderData()
  const dictionary = useDictionary()
  const locale = useLocale()
  const jsonLd = buildSiteJsonLd(locale)

  return (
    <div
      data-branch="non_tech"
      className="bg-branch-ground text-branch-text flex min-h-screen flex-col"
    >
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {/* First tab stop on every page (§7.7): past the nav and the switcher
          in one key press. A plain fragment link, so it works before
          hydration like the language switcher does. */}
      <a
        href="#continut"
        className="bg-paper text-ink sr-only rounded-md px-4 py-2 text-sm font-semibold focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[60]"
      >
        {dictionary.site.skipToContent}
      </a>
      <SiteHeader />
      <div id="continut" tabIndex={-1} className="flex flex-1 flex-col">
        <Outlet />
      </div>
      <SiteFooter info={contact} />
    </div>
  )
}
