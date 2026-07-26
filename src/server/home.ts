import { createServerFn } from '@tanstack/react-start'
import { and, asc, count, eq, isNotNull, lte, sql } from 'drizzle-orm'

import { db } from '@/db'
import {
  award,
  homeSlide,
  newsPost,
  performanceEntry,
  qrScan,
  season,
  sponsor,
  teamMember,
} from '@/db/schema'

/**
 * Home page data — CLAUDE.md §4.
 *
 * The stats row is a CACHED aggregate, never a per-request query (§12): it
 * touches seven tables, and a judge on venue wifi should not wait on that.
 */

export type HomeStats = {
  seasons: number
  awards: number
  members: number
  outreachEvents: number
  peopleReached: number
  sponsors: number
  scans: number
}

/** Content changes rarely, so a short TTL is enough to flatten bursts. */
const STATS_TTL_MS = 5 * 60 * 1000

let cached: { at: number; value: HomeStats } | null = null

/**
 * Invalidate after a write. Not yet called from the admin mutations — the TTL
 * covers correctness, this just makes an edit show up immediately once wired.
 */
export function invalidateHomeStats(): void {
  cached = null
}

async function computeStats(): Promise<HomeStats> {
  const [
    seasons,
    awards,
    members,
    outreach,
    sponsors,
    scans,
    reach,
  ] = await Promise.all([
    db.select({ n: count() }).from(season),
    db.select({ n: count() }).from(award),
    db
      .select({ n: count() })
      .from(teamMember)
      .where(eq(teamMember.isActive, true)),
    db
      .select({ n: count() })
      .from(performanceEntry)
      .where(eq(performanceEntry.branch, 'non_tech')),
    db.select({ n: count() }).from(sponsor),
    db.select({ n: count() }).from(qrScan),
    // Summed out of the jsonb metrics that §5 attaches to entries.
    db
      .select({
        total: sql<number>`coalesce(sum((${performanceEntry.metrics} ->> 'peopleReached')::int), 0)`,
      })
      .from(performanceEntry),
  ])

  return {
    seasons: seasons[0]?.n ?? 0,
    awards: awards[0]?.n ?? 0,
    members: members[0]?.n ?? 0,
    outreachEvents: outreach[0]?.n ?? 0,
    peopleReached: Number(reach[0]?.total ?? 0),
    sponsors: sponsors[0]?.n ?? 0,
    scans: scans[0]?.n ?? 0,
  }
}

export const getHomeStats = createServerFn({ method: 'GET' }).handler(
  async () => {
    if (cached && Date.now() - cached.at < STATS_TTL_MS) return cached.value

    const value = await computeStats()
    cached = { at: Date.now(), value }
    return value
  },
)

/** Hero slides, admin-managed (§4). Inactive ones never reach the page. */
export const getHomeSlides = createServerFn({ method: 'GET' }).handler(
  async () =>
    db
      .select({
        id: homeSlide.id,
        image: homeSlide.image,
        captionRo: homeSlide.captionRo,
        captionEn: homeSlide.captionEn,
        linkPath: homeSlide.linkPath,
      })
      .from(homeSlide)
      .where(eq(homeSlide.isActive, true))
      .orderBy(asc(homeSlide.displayOrder)),
)

/** Everything the home page needs, in one round trip. */
export const getHomeData = createServerFn({ method: 'GET' }).handler(
  async () => {
    const [slides, awards, news, sponsors, stats] = await Promise.all([
      db
        .select({
          id: homeSlide.id,
          image: homeSlide.image,
          captionRo: homeSlide.captionRo,
          captionEn: homeSlide.captionEn,
          linkPath: homeSlide.linkPath,
        })
        .from(homeSlide)
        .where(eq(homeSlide.isActive, true))
        .orderBy(asc(homeSlide.displayOrder)),

      db
        .select({
          id: award.id,
          nameRo: award.nameRo,
          nameEn: award.nameEn,
          eventName: award.eventName,
          eventDate: award.eventDate,
          seasonSlug: season.slug,
        })
        .from(award)
        .innerJoin(season, eq(award.seasonId, season.id))
        .orderBy(sql`${award.isFeatured} desc`, sql`${award.eventDate} desc`)
        .limit(4),

      db
        .select({
          slug: newsPost.slug,
          titleRo: newsPost.titleRo,
          titleEn: newsPost.titleEn,
          excerptRo: newsPost.excerptRo,
          excerptEn: newsPost.excerptEn,
          coverImage: newsPost.coverImage,
          publishedAt: newsPost.publishedAt,
        })
        .from(newsPost)
        .where(
          and(
            isNotNull(newsPost.publishedAt),
            lte(newsPost.publishedAt, new Date()),
          ),
        )
        .orderBy(sql`${newsPost.publishedAt} desc`)
        .limit(3),

      db
        .select({
          id: sponsor.id,
          name: sponsor.name,
          logo: sponsor.logo,
          logoDark: sponsor.logoDark,
          websiteUrl: sponsor.websiteUrl,
        })
        .from(sponsor)
        .orderBy(asc(sponsor.displayOrder))
        .limit(8),

      getHomeStats(),
    ])

    return { slides, awards, news, sponsors, stats }
  },
)

export type HomeData = Awaited<ReturnType<typeof getHomeData>>
