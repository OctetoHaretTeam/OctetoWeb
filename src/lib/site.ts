/**
 * Absolute-URL helpers for canonical links, `hreflang` alternates and `og:`
 * tags (CLAUDE.md §11).
 *
 * `VITE_SITE_URL` is intentionally public — it is the site's own address, and
 * the client needs it to build these tags. Never give a secret a VITE_ prefix.
 *
 * TODO: the final domain is still open (§15.2) and gets printed on
 * merchandise, so it must be locked before any merch run.
 */
export const SITE_URL = (
  import.meta.env.VITE_SITE_URL ?? 'http://localhost:3000'
).replace(/\/+$/, '')

export function absoluteUrl(path: string): string {
  return `${SITE_URL}${path.startsWith('/') ? path : `/${path}`}`
}
