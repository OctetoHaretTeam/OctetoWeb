import { createServerFn } from '@tanstack/react-start'
import { asc, desc, eq, ne, sql } from 'drizzle-orm'
import { z } from 'zod'

import { db } from '@/db'
import { award, season } from '@/db/schema'
import { awardFormSchema, seasonFormSchema } from '@/lib/forms/entities'
import { adminMiddleware } from '@/server/auth/middleware'

/**
 * Season and award administration — CLAUDE.md §10.
 *
 * Awards live here rather than in their own section because an award only
 * exists in the context of a season, and §4 renders them from the season page
 * and the home strip rather than from a page of their own.
 */

export const adminListSeasons = createServerFn({ method: 'GET' })
  .middleware([adminMiddleware])
  .handler(async () =>
    db
      .select({
        id: season.id,
        slug: season.slug,
        name: season.name,
        gameName: season.gameName,
        startDate: season.startDate,
        endDate: season.endDate,
        isCurrent: season.isCurrent,
        displayOrder: season.displayOrder,
        portfolioUrl: season.portfolioUrl,
      })
      .from(season)
      .orderBy(asc(season.displayOrder), desc(season.startDate)),
  )

export const adminGetSeason = createServerFn({ method: 'GET' })
  .middleware([adminMiddleware])
  .validator(z.object({ slug: z.string().min(1) }))
  .handler(async ({ data }) => {
    const rows = await db
      .select()
      .from(season)
      .where(eq(season.slug, data.slug))
      .limit(1)

    return rows[0] ?? null
  })

/**
 * Only one season may be current (§5 enforces it with a partial unique
 * index), so every caller clears the rest BEFORE setting its own row — never
 * the other way round, or the constraint trips.
 *
 * Not run inside `db.transaction(...)`: production's driver
 * (`drizzle-orm/neon-http`) throws unconditionally on `.transaction()` calls
 * (see the comment on adminReorderHomeSlides in server/admin/misc.ts). The
 * clear-then-set ORDER is what keeps the constraint satisfied at every
 * intermediate step even without atomicity — the only residual risk is the
 * second statement failing after the first succeeds, which leaves zero
 * current seasons rather than a constraint violation, and is repaired by
 * simply retrying.
 */
async function clearOtherCurrent(keepId: string | null) {
  await db
    .update(season)
    .set({ isCurrent: false })
    .where(keepId ? ne(season.id, keepId) : sql`true`)
}

export const adminCreateSeason = createServerFn({ method: 'POST' })
  .middleware([adminMiddleware])
  .validator(seasonFormSchema)
  .handler(async ({ data }) => {
    const clash = await db
      .select({ slug: season.slug })
      .from(season)
      .where(eq(season.slug, data.slug))
      .limit(1)

    if (clash.length > 0) {
      return { ok: false as const, error: 'slug-taken' as const }
    }

    if (data.isCurrent) await clearOtherCurrent(null)
    await db.insert(season).values(data)

    return { ok: true as const, slug: data.slug }
  })

export const adminUpdateSeason = createServerFn({ method: 'POST' })
  .middleware([adminMiddleware])
  .validator(
    z.object({ currentSlug: z.string().min(1), values: seasonFormSchema }),
  )
  .handler(async ({ data }) => {
    const existing = await db
      .select({ id: season.id })
      .from(season)
      .where(eq(season.slug, data.currentSlug))
      .limit(1)

    const row = existing[0]
    if (!row) return { ok: false as const, error: 'not-found' as const }

    if (data.values.slug !== data.currentSlug) {
      const clash = await db
        .select({ slug: season.slug })
        .from(season)
        .where(eq(season.slug, data.values.slug))
        .limit(1)

      if (clash.length > 0) {
        return { ok: false as const, error: 'slug-taken' as const }
      }
    }

    if (data.values.isCurrent) await clearOtherCurrent(row.id)
    await db.update(season).set(data.values).where(eq(season.id, row.id))

    return { ok: true as const, slug: data.values.slug }
  })

/**
 * Deleting a season is refused while it still has awards: the foreign key is
 * `restrict` on purpose (§5), because the team's two Connect Awards are its
 * public identity and must not vanish with a mistaken click.
 */
export const adminDeleteSeason = createServerFn({ method: 'POST' })
  .middleware([adminMiddleware])
  .validator(z.object({ slug: z.string().min(1) }))
  .handler(async ({ data }) => {
    const rows = await db
      .select({ id: season.id })
      .from(season)
      .where(eq(season.slug, data.slug))
      .limit(1)

    const row = rows[0]
    if (!row) return { ok: false as const, error: 'not-found' as const }

    const awards = await db
      .select({ id: award.id })
      .from(award)
      .where(eq(award.seasonId, row.id))
      .limit(1)

    if (awards.length > 0) {
      return { ok: false as const, error: 'has-awards' as const }
    }

    await db.delete(season).where(eq(season.id, row.id))
    return { ok: true as const }
  })

// ─── awards ──────────────────────────────────────────────────────────────────

export const adminListAwards = createServerFn({ method: 'GET' })
  .middleware([adminMiddleware])
  .handler(async () =>
    db
      .select({
        id: award.id,
        seasonId: award.seasonId,
        seasonName: season.name,
        nameRo: award.nameRo,
        eventName: award.eventName,
        eventDate: award.eventDate,
        placement: award.placement,
        isFeatured: award.isFeatured,
      })
      .from(award)
      .innerJoin(season, eq(award.seasonId, season.id))
      .orderBy(desc(award.eventDate)),
  )

export const adminCreateAward = createServerFn({ method: 'POST' })
  .middleware([adminMiddleware])
  .validator(awardFormSchema)
  .handler(async ({ data }) => {
    try {
      await db.insert(award).values(data)
      return { ok: true as const }
    } catch {
      // The unique index per (season, name, event) — §5 — is what this hits.
      return { ok: false as const, error: 'duplicate' as const }
    }
  })

export const adminUpdateAward = createServerFn({ method: 'POST' })
  .middleware([adminMiddleware])
  .validator(z.object({ id: z.uuid(), values: awardFormSchema }))
  .handler(async ({ data }) => {
    const updated = await db
      .update(award)
      .set(data.values)
      .where(eq(award.id, data.id))
      .returning({ id: award.id })

    return { ok: updated.length > 0 }
  })

export const adminDeleteAward = createServerFn({ method: 'POST' })
  .middleware([adminMiddleware])
  .validator(z.object({ id: z.uuid() }))
  .handler(async ({ data }) => {
    const deleted = await db
      .delete(award)
      .where(eq(award.id, data.id))
      .returning({ id: award.id })

    return { ok: deleted.length > 0 }
  })

export type AdminSeason = Awaited<ReturnType<typeof adminListSeasons>>[number]
export type AdminAward = Awaited<ReturnType<typeof adminListAwards>>[number]
