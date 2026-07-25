import type { ImageAsset } from './schemas'

/**
 * Minor-protection rules — CLAUDE.md §8.
 *
 * Team members are 14–18. These are not formatting preferences: they decide
 * whether a minor's photograph and surname appear on a public page.
 *
 * Always route member names and photos through these helpers — including in
 * page titles, meta descriptions and `og:` tags, which is exactly where the
 * rule is easiest to forget.
 */

type NameConsent = {
  name: string
  fullNamePublic: boolean
}

type PhotoConsent = {
  image: ImageAsset | null
  photoConsent: boolean
}

/**
 * The name that may be shown publicly.
 *
 * `fullNamePublic` defaults to false, in which case only the first name and
 * the initial of the last name may appear — "Andrei Popescu" becomes
 * "Andrei P.".
 *
 * For a name with more than two parts the middle parts are dropped rather than
 * initialised ("Ana Maria Popescu" becomes "Ana P."). That errs toward less
 * disclosure, which is the correct direction for this rule.
 */
export function publicDisplayName(member: NameConsent): string {
  const full = member.name.trim().replace(/\s+/g, ' ')

  if (member.fullNamePublic) return full

  const parts = full.split(' ').filter(Boolean)
  if (parts.length <= 1) return full

  const first = parts[0]
  const lastInitial = Array.from(parts[parts.length - 1])[0]

  return lastInitial ? `${first} ${lastInitial}.` : first
}

/**
 * The photograph that may be shown publicly, or null when consent is absent.
 *
 * `photoConsent` defaults to false. A null return means the caller must render
 * the placeholder avatar — never the photograph, even though one may exist in
 * the database.
 */
export function publicPhoto(member: PhotoConsent): ImageAsset | null {
  return member.photoConsent ? member.image : null
}
