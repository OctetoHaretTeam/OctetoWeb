import { createServerFn } from '@tanstack/react-start'
import { asc, desc, eq } from 'drizzle-orm'
import { z } from 'zod'

import { db } from '@/db'
import { newsPost, teamMember } from '@/db/schema'
import { newsFormSchema } from '@/lib/forms/entities'
import { adminMiddleware } from '@/server/auth/middleware'

/**
 * News administration — CLAUDE.md §10.
 *
 * `publishedAt === null` is the draft flag (§5). Nothing here filters drafts
 * out, because seeing them is the point of the admin list; the PUBLIC queries
 * are what must exclude them.
 */

export const adminListNews = createServerFn({ method: 'GET' })
  .middleware([adminMiddleware])
  .handler(async () =>
    db
      .select({
        slug: newsPost.slug,
        titleRo: newsPost.titleRo,
        titleEn: newsPost.titleEn,
        publishedAt: newsPost.publishedAt,
        updatedAt: newsPost.updatedAt,
      })
      .from(newsPost)
      .orderBy(desc(newsPost.updatedAt)),
  )

export const adminGetNews = createServerFn({ method: 'GET' })
  .middleware([adminMiddleware])
  .validator(z.object({ slug: z.string().min(1) }))
  .handler(async ({ data }) => {
    const rows = await db
      .select()
      .from(newsPost)
      .where(eq(newsPost.slug, data.slug))
      .limit(1)

    return rows[0] ?? null
  })

/** Authors are chosen from the roster, so the editor needs the list. */
export const adminListAuthors = createServerFn({ method: 'GET' })
  .middleware([adminMiddleware])
  .handler(async () =>
    db
      .select({ id: teamMember.id, name: teamMember.name })
      .from(teamMember)
      .orderBy(asc(teamMember.displayOrder), asc(teamMember.slug)),
  )

export const adminCreateNews = createServerFn({ method: 'POST' })
  .middleware([adminMiddleware])
  .validator(newsFormSchema)
  .handler(async ({ data }) => {
    const clash = await db
      .select({ slug: newsPost.slug })
      .from(newsPost)
      .where(eq(newsPost.slug, data.slug))
      .limit(1)

    if (clash.length > 0) {
      return { ok: false as const, error: 'slug-taken' as const }
    }

    await db.insert(newsPost).values(data)
    return { ok: true as const, slug: data.slug }
  })

export const adminUpdateNews = createServerFn({ method: 'POST' })
  .middleware([adminMiddleware])
  .validator(
    z.object({ currentSlug: z.string().min(1), values: newsFormSchema }),
  )
  .handler(async ({ data }) => {
    if (data.values.slug !== data.currentSlug) {
      const clash = await db
        .select({ slug: newsPost.slug })
        .from(newsPost)
        .where(eq(newsPost.slug, data.values.slug))
        .limit(1)

      if (clash.length > 0) {
        return { ok: false as const, error: 'slug-taken' as const }
      }
    }

    const updated = await db
      .update(newsPost)
      .set(data.values)
      .where(eq(newsPost.slug, data.currentSlug))
      .returning({ slug: newsPost.slug })

    if (updated.length === 0) {
      return { ok: false as const, error: 'not-found' as const }
    }

    return { ok: true as const, slug: data.values.slug }
  })

/**
 * Publishing and unpublishing are their own endpoints rather than a field on
 * the form, so the moment a post becomes public is an explicit act (§13's copy
 * rule: the button says "Publică", and this is what it does).
 */
export const adminSetNewsPublished = createServerFn({ method: 'POST' })
  .middleware([adminMiddleware])
  .validator(z.object({ slug: z.string().min(1), published: z.boolean() }))
  .handler(async ({ data }) => {
    const updated = await db
      .update(newsPost)
      .set({ publishedAt: data.published ? new Date() : null })
      .where(eq(newsPost.slug, data.slug))
      .returning({ publishedAt: newsPost.publishedAt })

    return { ok: updated.length > 0, publishedAt: updated[0]?.publishedAt ?? null }
  })

export const adminDeleteNews = createServerFn({ method: 'POST' })
  .middleware([adminMiddleware])
  .validator(z.object({ slug: z.string().min(1) }))
  .handler(async ({ data }) => {
    const deleted = await db
      .delete(newsPost)
      .where(eq(newsPost.slug, data.slug))
      .returning({ slug: newsPost.slug })

    return { ok: deleted.length > 0 }
  })

export type AdminNewsListItem = Awaited<
  ReturnType<typeof adminListNews>
>[number]
export type AdminAuthor = Awaited<ReturnType<typeof adminListAuthors>>[number]
