import { createServerFn } from '@tanstack/react-start'
import { asc, eq } from 'drizzle-orm'
import { z } from 'zod'

import { db } from '@/db'
import { teamMember } from '@/db/schema'
import { publicDisplayName, publicPhoto } from '@/lib/privacy'
import type { ImageAsset } from '@/lib/schemas'

/**
 * Team queries — CLAUDE.md §4.
 *
 * These run only on the server. Routes call them through `createServerFn`, so
 * Drizzle and the database credentials never enter the client bundle (§9).
 *
 * Every query selects columns explicitly rather than `select()`ing the whole
 * row. That is deliberate: it keeps `photoConsent` and `fullNamePublic` next
 * to the fields they gate, and it means a future column cannot start being
 * shipped to the browser just because someone added it to the table.
 */

const memberColumns = {
  slug: teamMember.slug,
  name: teamMember.name,
  roleRo: teamMember.roleRo,
  roleEn: teamMember.roleEn,
  branch: teamMember.branch,
  descriptionRo: teamMember.descriptionRo,
  descriptionEn: teamMember.descriptionEn,
  image: teamMember.image,
  instagramUrl: teamMember.instagramUrl,
  photoConsent: teamMember.photoConsent,
  fullNamePublic: teamMember.fullNamePublic,
} as const

type MemberRow = {
  name: string
  image: ImageAsset | null
  photoConsent: boolean
  fullNamePublic: boolean
}

/**
 * Applies the §8 consent rules HERE, at the server boundary, rather than in the
 * component that renders them.
 *
 * That distinction matters. A route loader's return value is serialised into
 * the HTML so the client can hydrate, so anything this function returns is
 * readable in the page source whether or not it is ever displayed. Deciding in
 * the component would leave a withheld photograph's URL and a minor's surname
 * sitting in view-source on every profile page.
 *
 * So the raw `name`, `photoConsent` and `fullNamePublic` never leave the
 * server: the client receives a name it is allowed to show and a photo it is
 * allowed to render, or nothing.
 */
function toPublicMember<T extends MemberRow>(row: T) {
  const { name: _name, photoConsent, fullNamePublic, image, ...rest } = row

  return {
    ...rest,
    displayName: publicDisplayName({ name: row.name, fullNamePublic }),
    image: publicPhoto({ image, photoConsent }),
  }
}

export const getTeamMembers = createServerFn({ method: 'GET' }).handler(
  async () => {
    const rows = await db
      .select(memberColumns)
      .from(teamMember)
      .where(eq(teamMember.isActive, true))
      .orderBy(asc(teamMember.displayOrder), asc(teamMember.slug))

    return rows.map(toPublicMember)
  },
)

export const getTeamMember = createServerFn({ method: 'GET' })
  .validator(z.object({ slug: z.string().min(1) }))
  .handler(async ({ data }) => {
    const rows = await db
      .select(memberColumns)
      .from(teamMember)
      .where(eq(teamMember.slug, data.slug))
      .limit(1)

    const row = rows[0]
    return row ? toPublicMember(row) : null
  })

export type TeamMemberSummary = Awaited<
  ReturnType<typeof getTeamMembers>
>[number]
