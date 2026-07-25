/**
 * The admin allowlist — CLAUDE.md §9.
 *
 * There is no users table, no registration and no password reset. Whether
 * someone may administer the site is decided by one thing: is the email on
 * their Google profile in `ALLOWED_ADMIN_EMAILS`.
 *
 * `ALLOWED_ADMIN_EMAILS` is read from `process.env` and never given a `VITE_`
 * prefix, so it cannot reach the client bundle.
 *
 * Everything here is pure so it can be tested exhaustively — this is the whole
 * authorization decision for the site.
 */

/**
 * Splits the comma-separated env var into normalised addresses.
 *
 * Blank entries are dropped rather than becoming an empty-string entry that
 * would match a profile with no email.
 */
export function parseAdminEmails(raw: string | undefined | null): string[] {
  if (!raw) return []

  return raw
    .split(',')
    .map((entry) => normaliseEmail(entry))
    .filter((entry) => entry.length > 0)
}

/**
 * Case-insensitive comparison, as §9 requires: Google may return
 * `Cineva@Example.com` for an allowlist entry written in lower case.
 *
 * Deliberately NOT doing anything cleverer than a normalised exact match — no
 * domain wildcards, no plus-address stripping, no unicode folding. Each of
 * those widens who can administer the site in a way that is easy to get wrong
 * and hard to notice.
 */
export function isAllowedAdmin(
  email: string | undefined | null,
  raw: string | undefined | null,
): boolean {
  const candidate = normaliseEmail(email ?? '')
  if (candidate.length === 0) return false

  return parseAdminEmails(raw).includes(candidate)
}

function normaliseEmail(value: string): string {
  return value.trim().toLowerCase()
}
