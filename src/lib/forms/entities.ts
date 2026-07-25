import { z } from 'zod'

import { gallerySchema, imageSchema, performanceMetricsSchema } from '@/lib/schemas'
import { slugSchema, unprefixedPathSchema } from './primitives'

/**
 * Input contracts for the remaining admin editors — CLAUDE.md §10.
 *
 * All hand-written pure Zod, like `team-member.ts` and for the same reason:
 * admin forms validate on the client, so anything they import ships to the
 * browser, and a drizzle-derived schema drags drizzle-orm in with it.
 *
 * `entities.test.ts` parses a valid value for each through the corresponding
 * drizzle-derived insert schema, so none of these can drift from its table.
 */

/** Empty strings are not the same as absent — §5 relies on the difference. */
const nullableText = z.string().nullable()
const nullableUrl = z.url('Adresa nu pare validă.').nullable()
/** Drizzle returns `date` columns as `YYYY-MM-DD` strings. */
const dateString = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Folosește formatul AAAA-LL-ZZ.')

// ─── season ──────────────────────────────────────────────────────────────────

export const seasonFormSchema = z.object({
  slug: slugSchema,
  name: z.string().min(1, 'Numele sezonului este obligatoriu.'),
  gameName: z.string().min(1, 'Numele jocului este obligatoriu.'),
  startDate: dateString,
  /** Null while the season is still running. */
  endDate: dateString.nullable(),
  descriptionRo: z.string().min(1, 'Descrierea în română este obligatorie.'),
  descriptionEn: nullableText,
  coverImage: imageSchema.nullable(),
  gallery: gallerySchema,
  portfolioUrl: nullableUrl,
  isCurrent: z.boolean(),
  displayOrder: z.int(),
})

// ─── award ───────────────────────────────────────────────────────────────────

export const awardFormSchema = z.object({
  seasonId: z.uuid('Alege un sezon.'),
  nameRo: z.string().min(1, 'Numele premiului este obligatoriu.'),
  nameEn: nullableText,
  eventName: z.string().min(1, 'Numele evenimentului este obligatoriu.'),
  eventDate: dateString,
  placement: nullableText,
  notesRo: nullableText,
  notesEn: nullableText,
  isFeatured: z.boolean(),
})

// ─── performanceEntry ────────────────────────────────────────────────────────

export const TECH_CATEGORY_VALUES = [
  'innovation',
  'design',
  'cad',
  'code',
  'mechanical',
  'testing',
] as const

export const NON_TECH_CATEGORY_VALUES = [
  'outreach',
  'sponsorship',
  'pr_media',
  'events',
  'collaboration',
  'accessibility',
] as const

const performanceBase = z.object({
  slug: slugSchema,
  branch: z.enum(['tech', 'non_tech']),
  category: z.enum([...TECH_CATEGORY_VALUES, ...NON_TECH_CATEGORY_VALUES]),
  titleRo: z.string().min(1, 'Titlul în română este obligatoriu.'),
  titleEn: nullableText,
  summaryRo: z.string().min(1, 'Rezumatul în română este obligatoriu.'),
  summaryEn: nullableText,
  bodyRo: z.string().min(1, 'Textul în română este obligatoriu.'),
  bodyEn: nullableText,
  coverImage: imageSchema.nullable(),
  gallery: gallerySchema,
  date: dateString,
  seasonId: z.uuid().nullable(),
  metrics: performanceMetricsSchema.nullable(),
  isFeatured: z.boolean(),
  displayOrder: z.int(),
})

/**
 * Mirrors the `performance_entry_branch_category` check constraint: a tech
 * entry cannot carry a non-tech category, or §7.3's branch pages would show an
 * entry filed under the wrong half of the site.
 */
export const performanceFormSchema = performanceBase.refine(
  (entry) =>
    entry.branch === 'tech'
      ? (TECH_CATEGORY_VALUES as readonly string[]).includes(entry.category)
      : (NON_TECH_CATEGORY_VALUES as readonly string[]).includes(entry.category),
  { path: ['category'], message: 'Categoria nu aparține acestei ramuri.' },
)

/** Unrefined, for forms that need `.partial()` or field-level access. */
export { performanceBase as performanceFormBase }

// ─── newsPost ────────────────────────────────────────────────────────────────

export const newsFormSchema = z.object({
  slug: slugSchema,
  titleRo: z.string().min(1, 'Titlul în română este obligatoriu.'),
  titleEn: nullableText,
  excerptRo: z.string().min(1, 'Rezumatul în română este obligatoriu.'),
  excerptEn: nullableText,
  bodyRo: z.string().min(1, 'Textul în română este obligatoriu.'),
  bodyEn: nullableText,
  coverImage: imageSchema.nullable(),
  gallery: gallerySchema,
  /** Null means draft — §10. Never exposed on a public route. */
  publishedAt: z.date().nullable(),
  authorMemberId: z.uuid().nullable(),
})

// ─── sponsor ─────────────────────────────────────────────────────────────────

export const SPONSOR_TIERS = [
  'platinum',
  'gold',
  'silver',
  'partner',
  'in_kind',
] as const

export const sponsorFormSchema = z.object({
  name: z.string().min(1, 'Numele sponsorului este obligatoriu.').max(160),
  logo: imageSchema,
  logoDark: imageSchema.nullable(),
  descriptionRo: nullableText,
  descriptionEn: nullableText,
  websiteUrl: nullableUrl,
  tier: z.enum(SPONSOR_TIERS).nullable(),
  /** Season slugs. Not FK-enforced (§5) — validated against real slugs in the form. */
  activeSeasons: z.array(slugSchema),
  displayOrder: z.int(),
})

// ─── homeSlide ───────────────────────────────────────────────────────────────

export const homeSlideFormSchema = z.object({
  image: imageSchema,
  captionRo: nullableText,
  captionEn: nullableText,
  linkPath: unprefixedPathSchema.nullable(),
  isActive: z.boolean(),
  displayOrder: z.int(),
})

// ─── qrCode ──────────────────────────────────────────────────────────────────

export const qrCodeFormSchema = z.object({
  code: slugSchema,
  label: z.string().min(1, 'Eticheta este obligatorie.').max(160),
  targetPath: unprefixedPathSchema,
  isActive: z.boolean(),
  printedOn: dateString.nullable(),
})

// ─── teamInfo ────────────────────────────────────────────────────────────────

export const teamInfoFormSchema = z.object({
  originStoryRo: z.string().min(1, 'Povestea în română este obligatorie.'),
  originStoryEn: nullableText,
  gallery: gallerySchema,
  foundedDate: dateString,
  schoolName: z.string().min(1, 'Numele școlii este obligatoriu.'),
  city: z.string().min(1, 'Orașul este obligatoriu.'),
  country: z
    .string()
    .regex(/^[A-Z]{2}$/, 'Cod de țară din două litere, cu majuscule.'),
  contactEmail: z.email('Adresa de email nu pare validă.'),
  phone: nullableText,
  socialLinks: z.object({
    instagram: z.url().optional(),
    tiktok: z.url().optional(),
    facebook: z.url().optional(),
    youtube: z.url().optional(),
    github: z.url().optional(),
    instagramFll: z.url().optional(),
  }),
  mapEmbedLat: z.number().min(-90).max(90).nullable(),
  mapEmbedLng: z.number().min(-180).max(180).nullable(),
})

export type SeasonFormInput = z.infer<typeof seasonFormSchema>
export type AwardFormInput = z.infer<typeof awardFormSchema>
export type PerformanceFormInput = z.infer<typeof performanceBase>
export type NewsFormInput = z.infer<typeof newsFormSchema>
export type SponsorFormInput = z.infer<typeof sponsorFormSchema>
export type HomeSlideFormInput = z.infer<typeof homeSlideFormSchema>
export type QrCodeFormInput = z.infer<typeof qrCodeFormSchema>
export type TeamInfoFormInput = z.infer<typeof teamInfoFormSchema>
