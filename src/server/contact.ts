import { createServerFn } from '@tanstack/react-start'
import { eq } from 'drizzle-orm'

import { db } from '@/db'
import { teamInfo } from '@/db/schema'

/**
 * Contact details for the site-wide footer — CLAUDE.md §4.
 *
 * Deliberately NOT `getTeamInfo`. That one returns the origin story and runs
 * it through markdown-it on the way out; this runs on every public page, so
 * paying for a markdown render on each of them to display an email address
 * would be exactly the kind of per-request cost §12 rules out. Only the
 * columns the footer actually shows are selected.
 *
 * Returns null when the singleton has never been filled in, so the footer can
 * omit itself rather than render a row of blanks.
 */
export const getContactInfo = createServerFn({ method: 'GET' }).handler(
  async () => {
    const rows = await db
      .select({
        contactEmail: teamInfo.contactEmail,
        phone: teamInfo.phone,
        schoolName: teamInfo.schoolName,
        city: teamInfo.city,
        country: teamInfo.country,
        socialLinks: teamInfo.socialLinks,
      })
      .from(teamInfo)
      .where(eq(teamInfo.id, 1))
      .limit(1)

    return rows[0] ?? null
  },
)

export type ContactInfo = Awaited<ReturnType<typeof getContactInfo>>
