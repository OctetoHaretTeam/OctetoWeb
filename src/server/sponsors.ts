import { createServerFn } from '@tanstack/react-start'
import { asc } from 'drizzle-orm'

import { db } from '@/db'
import { sponsor } from '@/db/schema'

/**
 * Public sponsor queries — CLAUDE.md §4.
 *
 * Ordered by `displayOrder` alone rather than by tier: §5 makes `tier`
 * nullable and §15.4 leaves open whether the team uses tiers at all, so the
 * order the admin sets is the one that ships.
 */
export const getSponsors = createServerFn({ method: 'GET' }).handler(async () =>
  db
    .select({
      id: sponsor.id,
      name: sponsor.name,
      logo: sponsor.logo,
      logoDark: sponsor.logoDark,
      descriptionRo: sponsor.descriptionRo,
      descriptionEn: sponsor.descriptionEn,
      websiteUrl: sponsor.websiteUrl,
      tier: sponsor.tier,
      activeSeasons: sponsor.activeSeasons,
    })
    .from(sponsor)
    .orderBy(asc(sponsor.displayOrder), asc(sponsor.name)),
)

export type PublicSponsor = Awaited<ReturnType<typeof getSponsors>>[number]
