import { createServerFn } from '@tanstack/react-start'
import { asc, eq, sql } from 'drizzle-orm'
import { z } from 'zod'

import { db } from '@/db'
import { season, sponsor } from '@/db/schema'
import { sponsorFormSchema } from '@/lib/forms/entities'
import { adminMiddleware } from '@/server/auth/middleware'

/**
 * Sponsor administration — CLAUDE.md §10.
 *
 * Sponsors are identified by their uuid rather than a slug: §5 gives this
 * table no slug, and a company name is not stable enough to key on.
 */

export const adminListSponsors = createServerFn({ method: 'GET' })
  .middleware([adminMiddleware])
  .handler(async () =>
    db
      .select({
        id: sponsor.id,
        name: sponsor.name,
        tier: sponsor.tier,
        websiteUrl: sponsor.websiteUrl,
        displayOrder: sponsor.displayOrder,
        activeSeasons: sponsor.activeSeasons,
      })
      .from(sponsor)
      .orderBy(asc(sponsor.displayOrder), asc(sponsor.name)),
  )

export const adminGetSponsor = createServerFn({ method: 'GET' })
  .middleware([adminMiddleware])
  .validator(z.object({ id: z.uuid() }))
  .handler(async ({ data }) => {
    const rows = await db
      .select()
      .from(sponsor)
      .where(eq(sponsor.id, data.id))
      .limit(1)

    return rows[0] ?? null
  })

/** `activeSeasons` holds season slugs, so the editor offers the real list. */
export const adminListSeasonSlugs = createServerFn({ method: 'GET' })
  .middleware([adminMiddleware])
  .handler(async () =>
    db
      .select({ slug: season.slug, name: season.name })
      .from(season)
      .orderBy(asc(season.displayOrder)),
  )

export const adminCreateSponsor = createServerFn({ method: 'POST' })
  .middleware([adminMiddleware])
  .validator(sponsorFormSchema)
  .handler(async ({ data }) => {
    const [created] = await db
      .insert(sponsor)
      .values(data)
      .returning({ id: sponsor.id })

    return { ok: true as const, id: created?.id ?? '' }
  })

export const adminUpdateSponsor = createServerFn({ method: 'POST' })
  .middleware([adminMiddleware])
  .validator(z.object({ id: z.uuid(), values: sponsorFormSchema }))
  .handler(async ({ data }) => {
    const updated = await db
      .update(sponsor)
      .set(data.values)
      .where(eq(sponsor.id, data.id))
      .returning({ id: sponsor.id })

    if (updated.length === 0) {
      return { ok: false as const, error: 'not-found' as const }
    }

    return { ok: true as const, id: data.id }
  })

export const adminDeleteSponsor = createServerFn({ method: 'POST' })
  .middleware([adminMiddleware])
  .validator(z.object({ id: z.uuid() }))
  .handler(async ({ data }) => {
    const deleted = await db
      .delete(sponsor)
      .where(eq(sponsor.id, data.id))
      .returning({ id: sponsor.id })

    return { ok: deleted.length > 0 }
  })

export const adminReorderSponsors = createServerFn({ method: 'POST' })
  .middleware([adminMiddleware])
  .validator(z.object({ ids: z.array(z.uuid()).min(1) }))
  .handler(async ({ data }) => {
    await db.transaction(async (tx) => {
      for (const [index, id] of data.ids.entries()) {
        await tx
          .update(sponsor)
          .set({ displayOrder: index })
          .where(eq(sponsor.id, id))
      }
    })

    return { ok: true }
  })

export const adminNextSponsorOrder = createServerFn({ method: 'GET' })
  .middleware([adminMiddleware])
  .handler(async () => {
    const [row] = await db
      .select({ max: sql<number | null>`max(${sponsor.displayOrder})` })
      .from(sponsor)

    return (row?.max ?? -1) + 1
  })

export type AdminSponsor = Awaited<ReturnType<typeof adminListSponsors>>[number]
