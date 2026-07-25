import { z } from 'zod'

/**
 * Shared Zod primitives for form input — CLAUDE.md §13.
 *
 * Deliberately free of any Drizzle import. Admin forms validate on the client
 * too (§10), so anything they import ships to the browser: pulling these from
 * `@/db/validation` dragged drizzle-orm and drizzle-zod into the public bundle
 * and doubled it.
 */

/** lower-kebab, no leading/trailing/double dashes. Slugs are printed on merch. */
export const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

export const slugSchema = z
  .string()
  .min(1)
  .max(96)
  .regex(SLUG_PATTERN, 'Doar litere mici, cifre și cratime.')

/** A site-relative path stored WITHOUT a locale prefix (§6, §11). */
export const unprefixedPathSchema = z
  .string()
  .regex(/^\//, 'Calea trebuie să înceapă cu „/".')
  .regex(
    /^\/(?!(ro|en)(\/|$))/,
    'Calea se păstrează fără prefix de limbă — prefixul se adaugă la redirecționare.',
  )

export const isoCountrySchema = z
  .string()
  .regex(/^[A-Z]{2}$/, 'Cod de țară ISO din două litere, cu majuscule.')
