import { createServerFn } from '@tanstack/react-start'
import { asc, desc, eq } from 'drizzle-orm'
import { z } from 'zod'

import { db } from '@/db'
import { performanceEntry, season } from '@/db/schema'
import { BRANCHES } from '@/lib/branch'

/**
 * Public performance queries — CLAUDE.md §4.
 *
 * Entries are filed under one of the two branches, and §5's check constraint
 * guarantees the category belongs to that branch — so a query by branch cannot
 * return something filed under the wrong half of the site.
 */

const listColumns = {
  slug: performanceEntry.slug,
  branch: performanceEntry.branch,
  category: performanceEntry.category,
  titleRo: performanceEntry.titleRo,
  titleEn: performanceEntry.titleEn,
  summaryRo: performanceEntry.summaryRo,
  summaryEn: performanceEntry.summaryEn,
  coverImage: performanceEntry.coverImage,
  date: performanceEntry.date,
  metrics: performanceEntry.metrics,
} as const

export const getPerformanceEntries = createServerFn({ method: 'GET' })
  .validator(
    z.object({
      branch: z.enum(BRANCHES).optional(),
      limit: z.int().positive().max(50).optional(),
    }),
  )
  .handler(async ({ data }) => {
    const base = db
      .select(listColumns)
      .from(performanceEntry)
      .orderBy(
        desc(performanceEntry.isFeatured),
        asc(performanceEntry.displayOrder),
        desc(performanceEntry.date),
      )

    const query = data.branch
      ? base.where(eq(performanceEntry.branch, data.branch))
      : base

    return data.limit ? query.limit(data.limit) : query
  })

export const getPerformanceEntry = createServerFn({ method: 'GET' })
  .validator(z.object({ branch: z.enum(BRANCHES), slug: z.string().min(1) }))
  .handler(async ({ data }) => {
    const rows = await db
      .select({
        slug: performanceEntry.slug,
        branch: performanceEntry.branch,
        category: performanceEntry.category,
        titleRo: performanceEntry.titleRo,
        titleEn: performanceEntry.titleEn,
        summaryRo: performanceEntry.summaryRo,
        summaryEn: performanceEntry.summaryEn,
        bodyRo: performanceEntry.bodyRo,
        bodyEn: performanceEntry.bodyEn,
        coverImage: performanceEntry.coverImage,
        gallery: performanceEntry.gallery,
        date: performanceEntry.date,
        metrics: performanceEntry.metrics,
        seasonName: season.name,
        seasonSlug: season.slug,
      })
      .from(performanceEntry)
      .leftJoin(season, eq(performanceEntry.seasonId, season.id))
      .where(eq(performanceEntry.slug, data.slug))
      .limit(1)

    const row = rows[0]
    // The branch is part of the URL, so a mismatch is a wrong address rather
    // than a redirect target — the slug alone is unique.
    if (!row || row.branch !== data.branch) return null

    const { bodyRo, bodyEn, ...rest } = row
    const { renderMarkdown } = await import('./markdown.server')

    return {
      ...rest,
      bodyHtml: {
        ro: renderMarkdown(bodyRo),
        en: bodyEn ? renderMarkdown(bodyEn) : null,
      },
    }
  })

/** Counts per branch, for the overview page's two halves. */
export const getPerformanceCounts = createServerFn({ method: 'GET' }).handler(
  async () => {
    const rows = await db
      .select({ branch: performanceEntry.branch })
      .from(performanceEntry)

    return {
      tech: rows.filter((r) => r.branch === 'tech').length,
      non_tech: rows.filter((r) => r.branch === 'non_tech').length,
    }
  },
)

export type PerformanceListItem = Awaited<
  ReturnType<typeof getPerformanceEntries>
>[number]
