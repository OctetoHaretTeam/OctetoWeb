import { createServerFn } from '@tanstack/react-start'
import { asc, desc, eq, sql } from 'drizzle-orm'
import { z } from 'zod'

import { db } from '@/db'
import { performanceEntry, season } from '@/db/schema'
import { performanceFormSchema } from '@/lib/forms/entities'
import { adminMiddleware } from '@/server/auth/middleware'

/**
 * Performance administration — CLAUDE.md §10.
 *
 * The form schema carries §5's branch/category rule, and the database repeats
 * it as a check constraint — so an entry cannot end up filed under the wrong
 * half of the site by either route.
 */

export const adminListPerformance = createServerFn({ method: 'GET' })
  .middleware([adminMiddleware])
  .handler(async () =>
    db
      .select({
        slug: performanceEntry.slug,
        branch: performanceEntry.branch,
        category: performanceEntry.category,
        titleRo: performanceEntry.titleRo,
        titleEn: performanceEntry.titleEn,
        date: performanceEntry.date,
        isFeatured: performanceEntry.isFeatured,
        displayOrder: performanceEntry.displayOrder,
      })
      .from(performanceEntry)
      .orderBy(asc(performanceEntry.displayOrder), desc(performanceEntry.date)),
  )

export const adminGetPerformance = createServerFn({ method: 'GET' })
  .middleware([adminMiddleware])
  .validator(z.object({ slug: z.string().min(1) }))
  .handler(async ({ data }) => {
    const rows = await db
      .select()
      .from(performanceEntry)
      .where(eq(performanceEntry.slug, data.slug))
      .limit(1)

    return rows[0] ?? null
  })

export const adminPerformanceSeasons = createServerFn({ method: 'GET' })
  .middleware([adminMiddleware])
  .handler(async () =>
    db
      .select({ id: season.id, name: season.name })
      .from(season)
      .orderBy(asc(season.displayOrder)),
  )

export const adminCreatePerformance = createServerFn({ method: 'POST' })
  .middleware([adminMiddleware])
  .validator(performanceFormSchema)
  .handler(async ({ data }) => {
    const clash = await db
      .select({ slug: performanceEntry.slug })
      .from(performanceEntry)
      .where(eq(performanceEntry.slug, data.slug))
      .limit(1)

    if (clash.length > 0) {
      return { ok: false as const, error: 'slug-taken' as const }
    }

    await db.insert(performanceEntry).values(data)
    return { ok: true as const, slug: data.slug }
  })

export const adminUpdatePerformance = createServerFn({ method: 'POST' })
  .middleware([adminMiddleware])
  .validator(
    z.object({
      currentSlug: z.string().min(1),
      values: performanceFormSchema,
    }),
  )
  .handler(async ({ data }) => {
    if (data.values.slug !== data.currentSlug) {
      const clash = await db
        .select({ slug: performanceEntry.slug })
        .from(performanceEntry)
        .where(eq(performanceEntry.slug, data.values.slug))
        .limit(1)

      if (clash.length > 0) {
        return { ok: false as const, error: 'slug-taken' as const }
      }
    }

    const updated = await db
      .update(performanceEntry)
      .set(data.values)
      .where(eq(performanceEntry.slug, data.currentSlug))
      .returning({ slug: performanceEntry.slug })

    if (updated.length === 0) {
      return { ok: false as const, error: 'not-found' as const }
    }

    return { ok: true as const, slug: data.values.slug }
  })

export const adminDeletePerformance = createServerFn({ method: 'POST' })
  .middleware([adminMiddleware])
  .validator(z.object({ slug: z.string().min(1) }))
  .handler(async ({ data }) => {
    const deleted = await db
      .delete(performanceEntry)
      .where(eq(performanceEntry.slug, data.slug))
      .returning({ slug: performanceEntry.slug })

    return { ok: deleted.length > 0 }
  })

export const adminReorderPerformance = createServerFn({ method: 'POST' })
  .middleware([adminMiddleware])
  .validator(z.object({ slugs: z.array(z.string().min(1)).min(1) }))
  .handler(async ({ data }) => {
    await db.transaction(async (tx) => {
      for (const [index, slug] of data.slugs.entries()) {
        await tx
          .update(performanceEntry)
          .set({ displayOrder: index })
          .where(eq(performanceEntry.slug, slug))
      }
    })
    return { ok: true }
  })

export const adminNextPerformanceOrder = createServerFn({ method: 'GET' })
  .middleware([adminMiddleware])
  .handler(async () => {
    const [row] = await db
      .select({ max: sql<number | null>`max(${performanceEntry.displayOrder})` })
      .from(performanceEntry)

    return (row?.max ?? -1) + 1
  })

export type AdminPerformanceItem = Awaited<
  ReturnType<typeof adminListPerformance>
>[number]
