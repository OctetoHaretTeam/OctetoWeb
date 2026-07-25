import { createServerFn } from '@tanstack/react-start'
import { asc, eq } from 'drizzle-orm'
import { z } from 'zod'

import { db } from '@/db'
import { qrCode } from '@/db/schema'
import { qrCodeFormSchema } from '@/lib/forms/entities'
import { adminMiddleware } from '@/server/auth/middleware'

/**
 * QR code administration — CLAUDE.md §10, for the §6 system.
 *
 * The codes can be created and printed before the `/q/$code` resolver exists;
 * what they cannot do yet is record scans, so the dashboard's scan statistics
 * stay empty until §6 lands.
 *
 * `targetPath` is validated as unprefixed both here and by the database check
 * constraint, because a locale-prefixed target would pin every scan of an
 * already-printed shirt to one language permanently (§6).
 */

export const adminListQrCodes = createServerFn({ method: 'GET' })
  .middleware([adminMiddleware])
  .handler(async () =>
    db
      .select({
        code: qrCode.code,
        label: qrCode.label,
        targetPath: qrCode.targetPath,
        isActive: qrCode.isActive,
        printedOn: qrCode.printedOn,
      })
      .from(qrCode)
      .orderBy(asc(qrCode.code)),
  )

export const adminGetQrCode = createServerFn({ method: 'GET' })
  .middleware([adminMiddleware])
  .validator(z.object({ code: z.string().min(1) }))
  .handler(async ({ data }) => {
    const rows = await db
      .select()
      .from(qrCode)
      .where(eq(qrCode.code, data.code))
      .limit(1)

    return rows[0] ?? null
  })

export const adminCreateQrCode = createServerFn({ method: 'POST' })
  .middleware([adminMiddleware])
  .validator(qrCodeFormSchema)
  .handler(async ({ data }) => {
    const clash = await db
      .select({ code: qrCode.code })
      .from(qrCode)
      .where(eq(qrCode.code, data.code))
      .limit(1)

    if (clash.length > 0) {
      return { ok: false as const, error: 'code-taken' as const }
    }

    await db.insert(qrCode).values(data)
    return { ok: true as const, code: data.code }
  })

export const adminUpdateQrCode = createServerFn({ method: 'POST' })
  .middleware([adminMiddleware])
  .validator(
    z.object({ currentCode: z.string().min(1), values: qrCodeFormSchema }),
  )
  .handler(async ({ data }) => {
    if (data.values.code !== data.currentCode) {
      const clash = await db
        .select({ code: qrCode.code })
        .from(qrCode)
        .where(eq(qrCode.code, data.values.code))
        .limit(1)

      if (clash.length > 0) {
        return { ok: false as const, error: 'code-taken' as const }
      }
    }

    const updated = await db
      .update(qrCode)
      .set(data.values)
      .where(eq(qrCode.code, data.currentCode))
      .returning({ code: qrCode.code })

    if (updated.length === 0) {
      return { ok: false as const, error: 'not-found' as const }
    }

    return { ok: true as const, code: data.values.code }
  })

/**
 * Deleting a code cascades its scan log (§5). Retiring a printed code is
 * almost always what the team actually wants, so the UI offers `isActive`
 * first and puts deletion behind a confirm dialog that says the history goes
 * with it.
 */
export const adminDeleteQrCode = createServerFn({ method: 'POST' })
  .middleware([adminMiddleware])
  .validator(z.object({ code: z.string().min(1) }))
  .handler(async ({ data }) => {
    const deleted = await db
      .delete(qrCode)
      .where(eq(qrCode.code, data.code))
      .returning({ code: qrCode.code })

    return { ok: deleted.length > 0 }
  })

export type AdminQrCode = Awaited<ReturnType<typeof adminListQrCodes>>[number]
