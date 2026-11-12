import { createFileRoute } from '@tanstack/react-router'
import { and, eq, isNotNull, lte } from 'drizzle-orm'

import { db } from '@/db'
import { newsPost, performanceEntry, season, teamMember } from '@/db/schema'
import { LOCALES, withLocale } from '@/i18n/locale'
import { absoluteUrl } from '@/lib/site'

/**
 * Dynamic bilingual `/sitemap.xml` endpoint — lists all static public routes
 * plus dynamic slugs (`team`, `seasons`, `performance`, `news`) in both `ro`
 * and `en` with `<xhtml:link rel="alternate" hreflang="..." />` annotations.
 *
 * Wraps database queries in `try / catch` so `/sitemap.xml` still succeeds with
 * all static routes even if the database is unreachable in a preview/test env.
 */
const STATIC_PATHS = [
  '/',
  '/team',
  '/performance',
  '/performance/tech',
  '/performance/non-tech',
  '/seasons',
  '/sponsors',
  '/news',
  '/about',
] as const

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

function renderBilingualUrlSet(unprefixedPath: string, priority = '0.8'): string {
  const roUrl = escapeXml(absoluteUrl(withLocale(unprefixedPath, 'ro')))
  const enUrl = escapeXml(absoluteUrl(withLocale(unprefixedPath, 'en')))

  return LOCALES.map((locale) => {
    const loc = escapeXml(absoluteUrl(withLocale(unprefixedPath, locale)))
    return [
      '  <url>',
      `    <loc>${loc}</loc>`,
      `    <xhtml:link rel="alternate" hreflang="ro-MD" href="${roUrl}" />`,
      `    <xhtml:link rel="alternate" hreflang="en" href="${enUrl}" />`,
      `    <xhtml:link rel="alternate" hreflang="x-default" href="${roUrl}" />`,
      `    <priority>${priority}</priority>`,
      '  </url>',
    ].join('\n')
  }).join('\n')
}

export const Route = createFileRoute('/sitemap.xml')({
  server: {
    handlers: {
      GET: async () => {
        const dynamicPaths: string[] = []

        try {
          const [members, seasonsList, entries, posts] = await Promise.all([
            db
              .select({ slug: teamMember.slug })
              .from(teamMember)
              .where(eq(teamMember.isActive, true)),
            db.select({ slug: season.slug }).from(season),
            db
              .select({
                slug: performanceEntry.slug,
                branch: performanceEntry.branch,
              })
              .from(performanceEntry),
            db
              .select({ slug: newsPost.slug })
              .from(newsPost)
              .where(
                and(
                  isNotNull(newsPost.publishedAt),
                  lte(newsPost.publishedAt, new Date()),
                ),
              ),
          ])

          for (const m of members) {
            dynamicPaths.push(`/team/${m.slug}`)
          }
          for (const s of seasonsList) {
            dynamicPaths.push(`/seasons/${s.slug}`)
          }
          for (const e of entries) {
            const branchSegment = e.branch === 'tech' ? 'tech' : 'non-tech'
            dynamicPaths.push(`/performance/${branchSegment}/${e.slug}`)
          }
          for (const p of posts) {
            dynamicPaths.push(`/news/${p.slug}`)
          }
        } catch {
          // Graceful fallback: emit static bilingual routes even if DB is unavailable.
        }

        const entriesXml = [
          ...STATIC_PATHS.map((p) =>
            renderBilingualUrlSet(p, p === '/' ? '1.0' : '0.8'),
          ),
          ...dynamicPaths.map((p) => renderBilingualUrlSet(p, '0.7')),
        ].join('\n')

        const xml = [
          '<?xml version="1.0" encoding="UTF-8"?>',
          '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">',
          entriesXml,
          '</urlset>',
          '',
        ].join('\n')

        return new Response(xml, {
          status: 200,
          headers: {
            'content-type': 'application/xml; charset=utf-8',
            'cache-control': 'public, max-age=3600, s-maxage=3600',
          },
        })
      },
    },
  },
})
