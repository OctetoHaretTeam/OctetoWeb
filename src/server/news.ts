import { createServerFn } from '@tanstack/react-start'
import { and, desc, eq, isNotNull, lte, ne } from 'drizzle-orm'
import { z } from 'zod'

import { db } from '@/db'
import { newsPost, teamMember } from '@/db/schema'
import { LOCALES, type Locale } from '@/i18n/locale'
import { publicDisplayName } from '@/lib/privacy'

/**
 * Public news queries — CLAUDE.md §4.
 *
 * **Every query here filters on `publishedAt`.** A draft is `publishedAt IS
 * NULL` (§5), and a future date means scheduled — neither may appear on a
 * public route. The admin queries deliberately do not filter; these must.
 */

/** Published means: has a date, and that date has passed. */
const isPublished = () =>
  and(isNotNull(newsPost.publishedAt), lte(newsPost.publishedAt, new Date()))

const listColumns = {
  slug: newsPost.slug,
  titleRo: newsPost.titleRo,
  titleEn: newsPost.titleEn,
  excerptRo: newsPost.excerptRo,
  excerptEn: newsPost.excerptEn,
  coverImage: newsPost.coverImage,
  publishedAt: newsPost.publishedAt,
} as const

export const getPublishedNews = createServerFn({ method: 'GET' })
  .validator(z.object({ limit: z.int().positive().max(50).optional() }))
  .handler(async ({ data }) => {
    const query = db
      .select(listColumns)
      .from(newsPost)
      .where(isPublished())
      .orderBy(desc(newsPost.publishedAt))

    return data.limit ? query.limit(data.limit) : query
  })

export const getNewsPost = createServerFn({ method: 'GET' })
  .validator(z.object({ slug: z.string().min(1) }))
  .handler(async ({ data }) => {
    const rows = await db
      .select({
        slug: newsPost.slug,
        titleRo: newsPost.titleRo,
        titleEn: newsPost.titleEn,
        excerptRo: newsPost.excerptRo,
        excerptEn: newsPost.excerptEn,
        bodyRo: newsPost.bodyRo,
        bodyEn: newsPost.bodyEn,
        coverImage: newsPost.coverImage,
        gallery: newsPost.gallery,
        publishedAt: newsPost.publishedAt,
        authorName: teamMember.name,
        authorSlug: teamMember.slug,
        authorFullNamePublic: teamMember.fullNamePublic,
      })
      .from(newsPost)
      .leftJoin(teamMember, eq(newsPost.authorMemberId, teamMember.id))
      .where(and(eq(newsPost.slug, data.slug), isPublished()))
      .limit(1)

    const row = rows[0]
    if (!row) return null

    // Render both languages here so markdown-it stays on the server (§12), and
    // apply the §8 name rule to the author before the row leaves.
    const { renderMarkdown } = await import('./markdown.server')
    const {
      bodyRo,
      bodyEn,
      authorName,
      authorFullNamePublic,
      ...rest
    } = row

    return {
      ...rest,
      bodyHtml: {
        ro: renderMarkdown(bodyRo),
        en: bodyEn ? renderMarkdown(bodyEn) : null,
      },
      author: authorName
        ? {
            name: publicDisplayName({
              name: authorName,
              fullNamePublic: authorFullNamePublic ?? false,
            }),
            slug: row.authorSlug,
          }
        : null,
    }
  })

/** Neighbouring posts, for moving through the archive without going back. */
export const getAdjacentNews = createServerFn({ method: 'GET' })
  .validator(z.object({ slug: z.string().min(1) }))
  .handler(async ({ data }) =>
    db
      .select({ slug: newsPost.slug, titleRo: newsPost.titleRo, titleEn: newsPost.titleEn })
      .from(newsPost)
      .where(and(isPublished(), ne(newsPost.slug, data.slug)))
      .orderBy(desc(newsPost.publishedAt))
      .limit(3),
  )

export type PublishedNewsItem = Awaited<
  ReturnType<typeof getPublishedNews>
>[number]

/** Both locales are prerenderable; kept here so routes agree on the list. */
export const PUBLIC_LOCALES: readonly Locale[] = LOCALES
