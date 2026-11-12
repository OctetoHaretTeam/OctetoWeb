import type { Locale } from '@/i18n/locale'

/**
 * Absolute-URL and SEO helpers for canonical links, `hreflang` alternates,
 * OpenGraph / Twitter Card tags, JSON-LD structured data, `robots.txt` and
 * `sitemap.xml` (CLAUDE.md §11).
 *
 * `VITE_SITE_URL` is intentionally public — it is the site's own address, and
 * the client needs it to build these tags. Never give a secret a VITE_ prefix.
 */
export const DEFAULT_SITE_URL = 'https://octeto.md'

const rawSiteUrl =
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SITE_URL) ||
  (typeof process !== 'undefined' && process.env?.VITE_SITE_URL) ||
  DEFAULT_SITE_URL

export const SITE_URL = rawSiteUrl.replace(/\/+$/, '')

/**
 * Converts a site-relative path (`/ro/team`) into an absolute URL, or returns
 * an already-absolute `http(s)://` URL unchanged (e.g. Vercel Blob image URLs).
 */
export function absoluteUrl(path: string): string {
  if (/^https?:\/\//i.test(path)) return path
  return `${SITE_URL}${path.startsWith('/') ? path : `/${path}`}`
}

export const SEO_KEYWORDS: Record<Locale, string> = {
  ro: 'OctetoHaret, Octeto Haret, Octeto, 25474, #25474, FTC 25474, FTC #25474, Team 25474, FIRST Tech Challenge 25474, FIRST Tech Challenge Moldova, robotica Chisinau, IPLT Spiru Haret, Liceul Teoretic Spiru Haret Chisinau, Connect Award FTC Moldova',
  en: 'OctetoHaret, Octeto Haret, Octeto, 25474, #25474, FTC 25474, FTC #25474, Team 25474, FIRST Tech Challenge 25474, FIRST Tech Challenge Moldova, robotics Chisinau Moldova, IPLT Spiru Haret, Spiru Haret High School Chisinau, Connect Award FTC Moldova',
}

export type PageMetaOptions = {
  title: string
  description: string
  locale: Locale
  pathname?: string
  image?: string | null
  imageAlt?: string
  type?: 'website' | 'article' | 'profile'
  keywords?: string
}

/**
 * Builds a complete, deduplicated array of `<meta>` descriptors for a route's
 * `head()` function: `<title>`, `description`, `keywords`, OpenGraph (`og:*`),
 * and Twitter Card (`twitter:*`) tags.
 */
export function buildPageMeta({
  title,
  description,
  locale,
  pathname,
  image,
  imageAlt = 'OctetoHaret — FTC #25474',
  type = 'website',
  keywords,
}: PageMetaOptions): Array<Record<string, string>> {
  const resolvedImage = absoluteUrl(image || '/logo.webp')
  const meta: Array<Record<string, string>> = [
    { title },
    { name: 'description', content: description },
    { name: 'keywords', content: keywords ?? SEO_KEYWORDS[locale] },
    { property: 'og:title', content: title },
    { property: 'og:description', content: description },
    { property: 'og:type', content: type },
    { property: 'og:image', content: resolvedImage },
    { property: 'og:image:alt', content: imageAlt },
    { name: 'twitter:card', content: 'summary_large_image' },
    { name: 'twitter:title', content: title },
    { name: 'twitter:description', content: description },
    { name: 'twitter:image', content: resolvedImage },
  ]

  if (pathname) {
    meta.push({ property: 'og:url', content: absoluteUrl(pathname) })
  }

  return meta
}

/**
 * Builds the Schema.org JSON-LD `@graph` (`Organization` / `SportsTeam` +
 * `WebSite`) so search engines associate all team name and number queries
 * (`OctetoHaret`, `Octeto Haret`, `Octeto`, `25474`, `#25474`, `FTC 25474`)
 * with this site.
 */
export function buildSiteJsonLd(locale: Locale): Record<string, unknown> {
  const description =
    locale === 'ro'
      ? 'OctetoHaret (FTC #25474) — echipa de robotică FIRST Tech Challenge a IPLT „Spiru Haret” din Chișinău, Republica Moldova.'
      : 'OctetoHaret (FTC #25474) — FIRST Tech Challenge robotics team at IPLT "Spiru Haret" in Chișinău, Moldova.'

  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': ['Organization', 'EducationalOrganization', 'SportsTeam'],
        '@id': `${SITE_URL}/#organization`,
        name: 'OctetoHaret',
        alternateName: [
          'Octeto',
          'Octeto Haret',
          'FTC 25474',
          'FTC #25474',
          'Team 25474',
          '#25474',
          '25474',
          'OctetoHaret #25474',
        ],
        identifier: '25474',
        description,
        url: SITE_URL,
        logo: absoluteUrl('/logo.webp'),
        image: absoluteUrl('/logo.webp'),
        foundingDate: '2024-01',
        sport: 'FIRST Tech Challenge Robotics',
        address: {
          '@type': 'PostalAddress',
          addressLocality: 'Chișinău',
          addressCountry: 'MD',
        },
        parentOrganization: {
          '@type': 'EducationalOrganization',
          name: 'IPLT „Spiru Haret” Chișinău',
        },
        award: [
          'Connect Award — FIRST Tech Challenge Moldova Championship 2025 (INTO THE DEEP)',
          'Connect Award — FIRST Tech Challenge Moldova Championship 2026 (DECODE)',
        ],
        sameAs: [
          'https://www.instagram.com/octetoharet.ftc/',
          'https://www.tiktok.com/@octetoharet',
          'https://www.instagram.com/octetoharet.fll/',
        ],
      },
      {
        '@type': 'WebSite',
        '@id': `${SITE_URL}/#website`,
        name: 'OctetoHaret — FTC #25474',
        alternateName: [
          'Octeto',
          'Octeto Haret',
          'OctetoHaret',
          'FTC 25474',
          'FTC #25474',
          '25474',
        ],
        url: SITE_URL,
        inLanguage: ['ro-MD', 'en'],
        publisher: {
          '@id': `${SITE_URL}/#organization`,
        },
      },
    ],
  }
}

