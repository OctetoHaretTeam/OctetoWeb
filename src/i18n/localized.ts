import type { Locale } from './locale'

/**
 * The RO-fallback rule — CLAUDE.md §5 and §11.
 *
 * Bilingual content is stored as `…Ro` / `…En` column pairs where `…En` may be
 * null. When English is requested but missing, the Romanian text is rendered
 * together with a quiet note saying so. Two things are never acceptable:
 * rendering an empty block, and machine-translating at render time.
 *
 * This module only decides *which text* to show and *whether it fell back*.
 * The wording of the note is a UI string and lives in the Phase 3 dictionaries
 * under `src/i18n/` — never hardcode it at a call site.
 */

/** A `…Ro` / `…En` column pair where the Romanian side is guaranteed present. */
export type RequiredBilingualField = {
  ro: string
  en?: string | null
}

/** A `…Ro` / `…En` column pair where both sides may be absent. */
export type BilingualField = {
  ro?: string | null
  en?: string | null
}

export type LocalizedResult = {
  /** The text to render. Never an empty string. */
  value: string
  /**
   * True when English was requested, was missing, and Romanian was used
   * instead. Render the "available in Romanian only" note when this is true.
   */
  isFallback: boolean
  /** The locale the returned text is actually written in. */
  resolvedLocale: Locale
}

export function getLocalized(
  field: RequiredBilingualField,
  locale: Locale,
): LocalizedResult
export function getLocalized(
  field: BilingualField,
  locale: Locale,
): LocalizedResult | null
export function getLocalized(
  field: BilingualField,
  locale: Locale,
): LocalizedResult | null {
  const ro = normalize(field.ro)
  const en = normalize(field.en)

  if (locale === 'en') {
    if (en !== null) {
      return { value: en, isFallback: false, resolvedLocale: 'en' }
    }
    // English requested, not available — fall back and say so.
    if (ro !== null) {
      return { value: ro, isFallback: true, resolvedLocale: 'ro' }
    }
    return null
  }

  if (ro !== null) {
    return { value: ro, isFallback: false, resolvedLocale: 'ro' }
  }
  // Romanian requested but only English exists. Not expected given the schema,
  // but showing the English text beats showing nothing.
  if (en !== null) {
    return { value: en, isFallback: true, resolvedLocale: 'en' }
  }
  return null
}

/**
 * Builds a bilingual field from a row's `…Ro` / `…En` column pair, so call
 * sites read `getLocalized(bilingual(post, 'title'), locale)` instead of
 * repeating the suffixes and risking a mismatched pair.
 */
export function bilingual<Base extends string>(
  row: Record<`${Base}Ro`, string | null> &
    Record<`${Base}En`, string | null>,
  base: Base,
): BilingualField {
  // The parameter type already forces the caller to pass a row that has both
  // `${base}Ro` and `${base}En`. TypeScript cannot narrow an indexed access
  // through a generic template-literal key, so the lookup itself is asserted.
  const columns = row as Record<string, string | null>

  return {
    ro: columns[`${base}Ro`],
    en: columns[`${base}En`],
  }
}

/** Treats whitespace-only text as absent, so a stray space cannot defeat the fallback. */
function normalize(value: string | null | undefined): string | null {
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : null
}
