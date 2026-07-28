import { createServerFn } from '@tanstack/react-start'
import { asc, count, desc, eq, gte, sql } from 'drizzle-orm'
import { z } from 'zod'

import { db } from '@/db'
import { homeSlide, qrCode, qrScan, teamInfo } from '@/db/schema'
import { homeSlideFormSchema, teamInfoFormSchema } from '@/lib/forms/entities'
import { adminMiddleware } from '@/server/auth/middleware'

/**
 * Home slides, team info and the QR dashboard — CLAUDE.md §10.
 */

// ─── home slides ─────────────────────────────────────────────────────────────

export const adminListHomeSlides = createServerFn({ method: 'GET' })
  .middleware([adminMiddleware])
  .handler(async () =>
    db
      .select({
        id: homeSlide.id,
        image: homeSlide.image,
        captionRo: homeSlide.captionRo,
        captionEn: homeSlide.captionEn,
        linkPath: homeSlide.linkPath,
        isActive: homeSlide.isActive,
        displayOrder: homeSlide.displayOrder,
      })
      .from(homeSlide)
      .orderBy(asc(homeSlide.displayOrder)),
  )

export const adminCreateHomeSlide = createServerFn({ method: 'POST' })
  .middleware([adminMiddleware])
  .validator(homeSlideFormSchema)
  .handler(async ({ data }) => {
    await db.insert(homeSlide).values(data)
    return { ok: true as const }
  })

export const adminUpdateHomeSlide = createServerFn({ method: 'POST' })
  .middleware([adminMiddleware])
  .validator(z.object({ id: z.uuid(), values: homeSlideFormSchema }))
  .handler(async ({ data }) => {
    const updated = await db
      .update(homeSlide)
      .set(data.values)
      .where(eq(homeSlide.id, data.id))
      .returning({ id: homeSlide.id })

    return { ok: updated.length > 0 }
  })

export const adminDeleteHomeSlide = createServerFn({ method: 'POST' })
  .middleware([adminMiddleware])
  .validator(z.object({ id: z.uuid() }))
  .handler(async ({ data }) => {
    const deleted = await db
      .delete(homeSlide)
      .where(eq(homeSlide.id, data.id))
      .returning({ id: homeSlide.id })

    return { ok: deleted.length > 0 }
  })

export const adminReorderHomeSlides = createServerFn({ method: 'POST' })
  .middleware([adminMiddleware])
  .validator(z.object({ ids: z.array(z.uuid()).min(1) }))
  .handler(async ({ data }) => {
    /*
     * NOT `db.transaction(...)`. Production runs on `drizzle-orm/neon-http`,
     * whose `.transaction()` unconditionally throws "No transactions support
     * in neon-http driver" — every call, not a rate limit or a flaky edge
     * case. It never surfaced locally because dev runs on PGlite, a
     * different driver that supports real transactions.
     *
     * A half-applied reorder here is a stale display position, self-healing
     * on the next successful reorder — not a correctness risk worth a driver
     * change (Neon's pooled/WebSocket driver does support transactions, at
     * the cost of a different connection model).
     */
    for (const [index, id] of data.ids.entries()) {
      await db
        .update(homeSlide)
        .set({ displayOrder: index })
        .where(eq(homeSlide.id, id))
    }
    return { ok: true }
  })

// ─── team info (singleton) ───────────────────────────────────────────────────

export const adminGetTeamInfo = createServerFn({ method: 'GET' })
  .middleware([adminMiddleware])
  .handler(async () => {
    const rows = await db.select().from(teamInfo).where(eq(teamInfo.id, 1)).limit(1)
    return rows[0] ?? null
  })

/**
 * One row, id 1 (§5). Upserted rather than inserted, so the form works whether
 * or not the singleton has ever been filled in.
 */
export const adminSaveTeamInfo = createServerFn({ method: 'POST' })
  .middleware([adminMiddleware])
  .validator(teamInfoFormSchema)
  .handler(async ({ data }) => {
    await db
      .insert(teamInfo)
      .values({ ...data, id: 1 })
      .onConflictDoUpdate({ target: teamInfo.id, set: data })

    return { ok: true as const }
  })

// ─── QR dashboard ────────────────────────────────────────────────────────────

/**
 * Scan statistics — §10 says the dashboard leads with these, because it is
 * what the team will actually open the panel for.
 *
 * Aggregates only. The underlying rows hold nothing but a code, a timestamp
 * and a coarse country (§6), so there is no personal data to aggregate over.
 */
export const adminScanStats = createServerFn({ method: 'GET' })
  .middleware([adminMiddleware])
  .handler(async () => {
    const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)

    const [total, last30, byCode, byCountry, recent] = await Promise.all([
      db.select({ n: count() }).from(qrScan),
      db.select({ n: count() }).from(qrScan).where(gte(qrScan.scannedAt, since)),
      db
        .select({
          code: qrCode.code,
          label: qrCode.label,
          n: count(qrScan.id),
        })
        .from(qrCode)
        .leftJoin(qrScan, eq(qrScan.qrCodeId, qrCode.id))
        .groupBy(qrCode.id, qrCode.code, qrCode.label)
        .orderBy(desc(count(qrScan.id))),
      db
        .select({ country: qrScan.country, n: count() })
        .from(qrScan)
        .groupBy(qrScan.country)
        .orderBy(desc(count())),
      db
        .select({ scannedAt: qrScan.scannedAt, code: qrCode.code })
        .from(qrScan)
        .innerJoin(qrCode, eq(qrScan.qrCodeId, qrCode.id))
        .orderBy(desc(qrScan.scannedAt))
        .limit(8),
    ])

    return {
      total: total[0]?.n ?? 0,
      last30Days: last30[0]?.n ?? 0,
      distinctCountries: byCountry.filter((row) => row.country !== null).length,
      byCode,
      byCountry,
      recent,
    }
  })

export type AdminScanStats = Awaited<ReturnType<typeof adminScanStats>>
export type AdminHomeSlide = Awaited<
  ReturnType<typeof adminListHomeSlides>
>[number]

/** Kept so the reorder helper below can suggest the next slot. */
export const adminNextSlideOrder = createServerFn({ method: 'GET' })
  .middleware([adminMiddleware])
  .handler(async () => {
    const [row] = await db
      .select({ max: sql<number | null>`max(${homeSlide.displayOrder})` })
      .from(homeSlide)

    return (row?.max ?? -1) + 1
  })
