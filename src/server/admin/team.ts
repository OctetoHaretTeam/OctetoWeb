import { createServerFn } from '@tanstack/react-start'
import { asc, eq, sql } from 'drizzle-orm'
import { z } from 'zod'

import { db } from '@/db'
import { teamMember } from '@/db/schema'
import { teamMemberFormSchema } from '@/lib/forms/team-member'
import { adminMiddleware } from '@/server/auth/middleware'

/**
 * Team administration — CLAUDE.md §10.
 *
 * Every function here carries `adminMiddleware`, which re-verifies the session
 * and the allowlist and enforces the Origin check. The route guard in
 * `/admin/_authed` is not enough: these are endpoints, callable directly.
 *
 * Validation runs again here even though the form validates too. The server
 * schema is the source of truth (§10) — the client's copy is a convenience for
 * the person typing, not a control.
 */

/**
 * The admin list shows inactive members as well, which the public roster hides.
 * Unlike the public query this returns the raw `name` and both consent flags —
 * that is the point of the editor, and it sits behind the allowlist.
 */
export const adminListTeamMembers = createServerFn({ method: 'GET' })
  .middleware([adminMiddleware])
  .handler(async () =>
    db
      .select({
        id: teamMember.id,
        slug: teamMember.slug,
        name: teamMember.name,
        roleRo: teamMember.roleRo,
        branch: teamMember.branch,
        isActive: teamMember.isActive,
        displayOrder: teamMember.displayOrder,
        photoConsent: teamMember.photoConsent,
        fullNamePublic: teamMember.fullNamePublic,
      })
      .from(teamMember)
      .orderBy(asc(teamMember.displayOrder), asc(teamMember.slug)),
  )

export const adminGetTeamMember = createServerFn({ method: 'GET' })
  .middleware([adminMiddleware])
  .validator(z.object({ slug: z.string().min(1) }))
  .handler(async ({ data }) => {
    const rows = await db
      .select()
      .from(teamMember)
      .where(eq(teamMember.slug, data.slug))
      .limit(1)

    return rows[0] ?? null
  })

/**
 * The editable shape, as a pure Zod schema shared with the form.
 *
 * Re-exported here for server-side use only. The FORM must import it from
 * `@/lib/forms/team-member` directly — importing it through this module would
 * pull Drizzle and the database client into the client bundle.
 */
export { teamMemberFormSchema }

export type TeamMemberForm = z.infer<typeof teamMemberFormSchema>

export const adminCreateTeamMember = createServerFn({ method: 'POST' })
  .middleware([adminMiddleware])
  .validator(teamMemberFormSchema)
  .handler(async ({ data }) => {
    const clash = await db
      .select({ slug: teamMember.slug })
      .from(teamMember)
      .where(eq(teamMember.slug, data.slug))
      .limit(1)

    if (clash.length > 0) {
      return { ok: false as const, error: 'slug-taken' as const }
    }

    const [created] = await db.insert(teamMember).values(data).returning({
      slug: teamMember.slug,
    })

    return { ok: true as const, slug: created?.slug ?? data.slug }
  })

export const adminUpdateTeamMember = createServerFn({ method: 'POST' })
  .middleware([adminMiddleware])
  .validator(
    z.object({
      /**
       * The slug identifying the row, kept separate from the payload so a
       * rename is explicit rather than an accident of editing a field.
       */
      currentSlug: z.string().min(1),
      values: teamMemberFormSchema,
    }),
  )
  .handler(async ({ data }) => {
    if (data.values.slug !== data.currentSlug) {
      const clash = await db
        .select({ slug: teamMember.slug })
        .from(teamMember)
        .where(eq(teamMember.slug, data.values.slug))
        .limit(1)

      if (clash.length > 0) {
        return { ok: false as const, error: 'slug-taken' as const }
      }
    }

    const updated = await db
      .update(teamMember)
      .set(data.values)
      .where(eq(teamMember.slug, data.currentSlug))
      .returning({ slug: teamMember.slug })

    if (updated.length === 0) {
      return { ok: false as const, error: 'not-found' as const }
    }

    return { ok: true as const, slug: data.values.slug }
  })

export const adminDeleteTeamMember = createServerFn({ method: 'POST' })
  .middleware([adminMiddleware])
  .validator(z.object({ slug: z.string().min(1) }))
  .handler(async ({ data }) => {
    const deleted = await db
      .delete(teamMember)
      .where(eq(teamMember.slug, data.slug))
      .returning({ slug: teamMember.slug })

    return { ok: deleted.length > 0 }
  })

/**
 * Persists a new order (§10).
 *
 * Written as one statement per row inside a transaction rather than a loop of
 * independent updates, so a half-applied reorder cannot survive a failure.
 */
export const adminReorderTeamMembers = createServerFn({ method: 'POST' })
  .middleware([adminMiddleware])
  .validator(z.object({ slugs: z.array(z.string().min(1)).min(1) }))
  .handler(async ({ data }) => {
    await db.transaction(async (tx) => {
      for (const [index, slug] of data.slugs.entries()) {
        await tx
          .update(teamMember)
          .set({ displayOrder: index })
          .where(eq(teamMember.slug, slug))
      }
    })

    return { ok: true }
  })

/** Suggests the next free slot so a new member lands at the end of the list. */
export const adminNextTeamOrder = createServerFn({ method: 'GET' })
  .middleware([adminMiddleware])
  .handler(async () => {
    const [row] = await db
      .select({ max: sql<number | null>`max(${teamMember.displayOrder})` })
      .from(teamMember)

    return (row?.max ?? -1) + 1
  })

export type AdminTeamMember = Awaited<
  ReturnType<typeof adminListTeamMembers>
>[number]

