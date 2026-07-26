import { z } from 'zod'

/**
 * Shared Zod schemas for the jsonb columns in `src/db/schema.ts`.
 *
 * These are the source of truth for the shapes Postgres stores as jsonb.
 * Drizzle types those columns with `$type<…>()` using the types inferred here,
 * so the table definition and the validator cannot drift apart.
 */

/** Bilingual alt text. `en` is optional — CLAUDE.md §5 falls back to `ro`. */
export const altTextSchema = z.object({
  ro: z.string().min(1, 'Textul alternativ în română este obligatoriu.'),
  en: z.string().min(1).optional(),
})

/**
 * The one image shape, reused by every image column (CLAUDE.md §5).
 *
 * `width` and `height` are required, not optional: CLAUDE.md §12 requires zero
 * CLS, which means every image must be able to reserve its exact box before it
 * loads. They are captured at upload time (§10).
 */
/**
 * An image URL is either absolute (Vercel Blob's CDN) or site-relative
 * (`/uploads/…`, the local development store).
 *
 * A bare `z.url()` here rejected every locally stored image, which made it
 * impossible to save any row with a picture attached — the failure surfaced as
 * "URL invalid" on whichever field happened to be checked first.
 */
export const imageUrlSchema = z
  .string()
  .refine(
    (value) =>
      // Site-relative, but not protocol-relative: `//evil.example` is absolute.
      /^\/(?!\/)/.test(value) || /^https?:\/\//.test(value),
    'Adresa imaginii trebuie să fie o cale din site sau o adresă http(s).',
  )

export const imageSchema = z.object({
  url: imageUrlSchema,
  alt: altTextSchema,
  width: z.int().positive(),
  height: z.int().positive(),
  blurhash: z.string().min(1).optional(),
})

export const gallerySchema = z.array(imageSchema)

/** Galleries are capped per entity so a page cannot become a slideshow (§12). */
export function galleryWithMax(max: number) {
  return z
    .array(imageSchema)
    .max(max, `Maxim ${max} imagini.`)
}

/**
 * Optional metrics on a performance entry. Every field is optional — an entry
 * may carry none. These feed the cached home stats row (CLAUDE.md §4).
 */
export const performanceMetricsSchema = z.object({
  peopleReached: z.int().nonnegative().optional(),
  schoolsVisited: z.int().nonnegative().optional(),
  fundsRaisedMdl: z.int().nonnegative().optional(),
})

/**
 * Social links on the team info singleton. Kept as a closed shape rather than
 * an open record so a typo becomes a validation error instead of a dead icon.
 */
export const socialLinksSchema = z.object({
  instagram: z.url().optional(),
  tiktok: z.url().optional(),
  facebook: z.url().optional(),
  youtube: z.url().optional(),
  github: z.url().optional(),
  /** Sister FLL team — linked from the About page (CLAUDE.md §1). */
  instagramFll: z.url().optional(),
})

export type AltText = z.infer<typeof altTextSchema>
export type ImageAsset = z.infer<typeof imageSchema>
export type Gallery = z.infer<typeof gallerySchema>
export type PerformanceMetrics = z.infer<typeof performanceMetricsSchema>
export type SocialLinks = z.infer<typeof socialLinksSchema>
