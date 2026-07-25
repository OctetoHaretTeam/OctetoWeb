import { createInsertSchema, createSelectSchema } from 'drizzle-zod'
import { z } from 'zod'

import {
  isoCountrySchema as isoCountry,
  slugSchema as slug,
  unprefixedPathSchema as unprefixedPath,
} from '@/lib/forms/primitives'
import {
  gallerySchema,
  imageSchema,
  performanceMetricsSchema,
  socialLinksSchema,
} from '@/lib/schemas'
import {
  NON_TECH_CATEGORIES,
  TECH_CATEGORIES,
  award,
  homeSlide,
  newsPost,
  performanceEntry,
  qrCode,
  qrScan,
  season,
  sponsor,
  teamInfo,
  teamMember,
} from './schema'

/**
 * Zod schemas for every table — CLAUDE.md §13.
 *
 * These are derived from the Drizzle tables with `drizzle-zod` rather than
 * hand-written, so a column change cannot silently leave a validator behind.
 * The jsonb columns are refined with the real shapes from `@/lib/schemas`,
 * because drizzle-zod cannot see through `$type<…>()` on its own.
 *
 * Every type below is produced with `z.infer`, so the Zod schema stays the
 * thing that defines the shape.
 *
 * The server is the source of truth: these run again inside every mutating
 * server function, never on the client alone (§10).
 */

// ─── season ──────────────────────────────────────────────────────────────────

/**
 * NOTE for every insert schema below: overriding a column here REPLACES the
 * optionality drizzle-zod inferred from the table. A nullable column must be
 * `.nullish()` and a column with a database default must be `.optional()`,
 * otherwise the override silently makes it required on insert.
 */
export const seasonInsertSchema = createInsertSchema(season, {
  slug,
  coverImage: imageSchema.nullish(),
  gallery: gallerySchema.optional(),
  portfolioUrl: z.url().nullish(),
})
export const seasonSelectSchema = createSelectSchema(season, {
  coverImage: imageSchema.nullable(),
  gallery: gallerySchema,
})

export type SeasonInsert = z.infer<typeof seasonInsertSchema>
export type Season = z.infer<typeof seasonSelectSchema>

// ─── award ───────────────────────────────────────────────────────────────────

export const awardInsertSchema = createInsertSchema(award)
export const awardSelectSchema = createSelectSchema(award)

export type AwardInsert = z.infer<typeof awardInsertSchema>
export type Award = z.infer<typeof awardSelectSchema>

// ─── teamMember ──────────────────────────────────────────────────────────────

export const teamMemberInsertSchema = createInsertSchema(teamMember, {
  slug,
  name: z.string().min(1).max(120),
  image: imageSchema.nullish(),
  instagramUrl: z.url().nullish(),
  octetIndex: z.int().min(0).max(255),
})
export const teamMemberSelectSchema = createSelectSchema(teamMember, {
  image: imageSchema.nullable(),
})

export type TeamMemberInsert = z.infer<typeof teamMemberInsertSchema>
export type TeamMember = z.infer<typeof teamMemberSelectSchema>

// ─── performanceEntry ────────────────────────────────────────────────────────

/**
 * Unrefined base — use this when a form needs `.partial()` or `.pick()`, then
 * apply `refineBranchCategory` to the result.
 */
export const performanceEntryBaseInsertSchema = createInsertSchema(
  performanceEntry,
  {
    slug,
    coverImage: imageSchema.nullish(),
    gallery: gallerySchema.optional(),
    metrics: performanceMetricsSchema.nullish(),
  },
)

/**
 * Mirrors the `performance_entry_branch_category` check constraint: a tech
 * entry cannot carry a non-tech category, or the branch pages in §7.3 would
 * show an entry filed under the wrong half of the site.
 */
export const performanceEntryInsertSchema =
  performanceEntryBaseInsertSchema.refine(
    (entry) =>
      entry.branch === 'tech'
        ? (TECH_CATEGORIES as readonly string[]).includes(entry.category)
        : (NON_TECH_CATEGORIES as readonly string[]).includes(entry.category),
    {
      path: ['category'],
      message: 'Categoria nu aparține acestei ramuri.',
    },
  )

export const performanceEntrySelectSchema = createSelectSchema(
  performanceEntry,
  {
    coverImage: imageSchema.nullable(),
    gallery: gallerySchema,
    metrics: performanceMetricsSchema.nullable(),
  },
)

export type PerformanceEntryInsert = z.infer<
  typeof performanceEntryInsertSchema
>
export type PerformanceEntry = z.infer<typeof performanceEntrySelectSchema>

// ─── newsPost ────────────────────────────────────────────────────────────────

export const newsPostInsertSchema = createInsertSchema(newsPost, {
  slug,
  coverImage: imageSchema.nullish(),
  gallery: gallerySchema.optional(),
})
export const newsPostSelectSchema = createSelectSchema(newsPost, {
  coverImage: imageSchema.nullable(),
  gallery: gallerySchema,
})

export type NewsPostInsert = z.infer<typeof newsPostInsertSchema>
export type NewsPost = z.infer<typeof newsPostSelectSchema>

// ─── sponsor ─────────────────────────────────────────────────────────────────

export const sponsorInsertSchema = createInsertSchema(sponsor, {
  name: z.string().min(1).max(160),
  logo: imageSchema,
  logoDark: imageSchema.nullish(),
  websiteUrl: z.url().nullish(),
  activeSeasons: z.array(slug).optional(),
})
export const sponsorSelectSchema = createSelectSchema(sponsor, {
  logo: imageSchema,
  logoDark: imageSchema.nullable(),
})

export type SponsorInsert = z.infer<typeof sponsorInsertSchema>
export type Sponsor = z.infer<typeof sponsorSelectSchema>

// ─── homeSlide ───────────────────────────────────────────────────────────────

export const homeSlideInsertSchema = createInsertSchema(homeSlide, {
  image: imageSchema,
  linkPath: unprefixedPath.nullish(),
})
export const homeSlideSelectSchema = createSelectSchema(homeSlide, {
  image: imageSchema,
})

export type HomeSlideInsert = z.infer<typeof homeSlideInsertSchema>
export type HomeSlide = z.infer<typeof homeSlideSelectSchema>

// ─── teamInfo ────────────────────────────────────────────────────────────────

export const teamInfoInsertSchema = createInsertSchema(teamInfo, {
  id: z.literal(1).optional(),
  gallery: gallerySchema.optional(),
  country: isoCountry,
  contactEmail: z.email(),
  socialLinks: socialLinksSchema.optional(),
  mapEmbedLat: z.number().min(-90).max(90).nullish(),
  mapEmbedLng: z.number().min(-180).max(180).nullish(),
})
export const teamInfoSelectSchema = createSelectSchema(teamInfo, {
  gallery: gallerySchema,
  socialLinks: socialLinksSchema,
})

export type TeamInfoInsert = z.infer<typeof teamInfoInsertSchema>
export type TeamInfo = z.infer<typeof teamInfoSelectSchema>

// ─── qrCode ──────────────────────────────────────────────────────────────────

export const qrCodeInsertSchema = createInsertSchema(qrCode, {
  code: slug,
  label: z.string().min(1).max(160),
  targetPath: unprefixedPath,
})
export const qrCodeSelectSchema = createSelectSchema(qrCode)

export type QrCodeInsert = z.infer<typeof qrCodeInsertSchema>
export type QrCode = z.infer<typeof qrCodeSelectSchema>

// ─── qrScan ──────────────────────────────────────────────────────────────────

/**
 * Only three fields are ever written: the code, the timestamp and a coarse
 * country. If a future change adds anything resembling an IP address, a user
 * agent or a device id, it violates §6 and §8 — reject it here first.
 */
export const qrScanInsertSchema = createInsertSchema(qrScan, {
  country: isoCountry.nullish(),
})
export const qrScanSelectSchema = createSelectSchema(qrScan)

export type QrScanInsert = z.infer<typeof qrScanInsertSchema>
export type QrScan = z.infer<typeof qrScanSelectSchema>
