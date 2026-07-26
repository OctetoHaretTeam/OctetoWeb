import { createServerFn } from '@tanstack/react-start'
import { asc, desc, eq } from 'drizzle-orm'
import { z } from 'zod'

import { db } from '@/db'
import { award, season } from '@/db/schema'

/**
 * Public season and award queries — CLAUDE.md §4.
 *
 * The season archive is the view judges look for, and awards are the team's
 * public identity, so both are read-only and unfiltered: unlike news there is
 * no draft concept here.
 */

export const getSeasons = createServerFn({ method: 'GET' }).handler(async () =>
  db
    .select({
      slug: season.slug,
      name: season.name,
      gameName: season.gameName,
      startDate: season.startDate,
      endDate: season.endDate,
      coverImage: season.coverImage,
      isCurrent: season.isCurrent,
    })
    .from(season)
    .orderBy(asc(season.displayOrder), desc(season.startDate)),
)

export const getSeason = createServerFn({ method: 'GET' })
  .validator(z.object({ slug: z.string().min(1) }))
  .handler(async ({ data }) => {
    const rows = await db
      .select()
      .from(season)
      .where(eq(season.slug, data.slug))
      .limit(1)

    const row = rows[0]
    if (!row) return null

    const awards = await db
      .select({
        id: award.id,
        nameRo: award.nameRo,
        nameEn: award.nameEn,
        eventName: award.eventName,
        eventDate: award.eventDate,
        placement: award.placement,
        notesRo: award.notesRo,
        notesEn: award.notesEn,
      })
      .from(award)
      .where(eq(award.seasonId, row.id))
      .orderBy(desc(award.eventDate))

    const { descriptionRo, descriptionEn, id: _id, ...rest } = row
    const { renderMarkdown } = await import('./markdown.server')

    return {
      ...rest,
      descriptionHtml: {
        ro: renderMarkdown(descriptionRo),
        en: descriptionEn ? renderMarkdown(descriptionEn) : null,
      },
      awards,
    }
  })

/**
 * Awards for the home strip — featured first, then most recent (§4).
 * Joined to the season so each can be attributed without a second query.
 */
export const getFeaturedAwards = createServerFn({ method: 'GET' })
  .validator(z.object({ limit: z.int().positive().max(20).optional() }))
  .handler(async ({ data }) =>
    db
      .select({
        id: award.id,
        nameRo: award.nameRo,
        nameEn: award.nameEn,
        eventName: award.eventName,
        eventDate: award.eventDate,
        placement: award.placement,
        seasonSlug: season.slug,
        seasonName: season.name,
      })
      .from(award)
      .innerJoin(season, eq(award.seasonId, season.id))
      .orderBy(desc(award.isFeatured), desc(award.eventDate))
      .limit(data.limit ?? 6),
  )

export type SeasonListItem = Awaited<ReturnType<typeof getSeasons>>[number]
export type FeaturedAward = Awaited<ReturnType<typeof getFeaturedAwards>>[number]
