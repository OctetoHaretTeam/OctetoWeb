import { createFileRoute } from '@tanstack/react-router'

import { withLocale } from '@/i18n/locale'
import { rateLimit } from '@/server/rate-limit'
import {
  countryFromHeaders,
  localeForScan,
  logScan,
  lookupCode,
} from '@/server/qr.server'

/**
 * The QR resolver — CLAUDE.md §6.
 *
 * A server route, so it renders nothing and ships no client JavaScript: this
 * is the hottest path in the app and it exists only to redirect.
 *
 * **307, not 301.** A permanent redirect is cached by browsers effectively
 * forever, so if a member graduates or a route changes, every already-printed
 * shirt breaks with no way to fix it. 307 keeps the redirect under the team's
 * control, which is the entire point of the system.
 *
 * The target is stored unprefixed (`/team/andrei`) and the locale is resolved
 * on the way through, so a judge at an international event lands on English
 * without touching the toggle.
 *
 * Rate-limited to 30 scans per minute per IP to prevent bots from flooding
 * the `qr_scan` table. This is generous enough for any real human usage —
 * even a judge scanning every member's shirt at a competition would not come
 * close.
 */
export const Route = createFileRoute('/q/$code')({
  server: {
    handlers: {
      GET: async ({ request }) => {
        // Bot protection: 30 scans per minute per IP.
        const blocked = rateLimit('qr-scan', request, 30, 60_000)
        if (blocked) return blocked

        const { pathname } = new URL(request.url)
        const code = decodeCode(pathname.replace(/^\/q\/?/, ''))

        if (!code) return unknown()

        const resolved = await lookupCode(code)

        // A retired code is treated exactly like an unknown one: the person
        // scanning gets a designed page either way, never a raw 404 (§6).
        if (!resolved || !resolved.isActive) return unknown()

        // Off the redirect path where the host allows it — see logScan.
        await logScan(request, resolved.id, countryFromHeaders(request.headers))

        const locale = localeForScan(
          request.headers,
          request.headers.get('cookie'),
        )

        return new Response(null, {
          status: 307,
          headers: {
            location: withLocale(resolved.targetPath, locale),
            // Never cache the hop itself, or the 307's whole purpose is lost.
            'cache-control': 'no-store',
          },
        })
      },
    },
  },
})

/**
 * A damaged print or a scanner that mangles the URL can send a malformed
 * escape like `%E0%A4`, on which `decodeURIComponent` throws. That is an
 * unknown code, not a server error (§6).
 */
function decodeCode(raw: string): string | null {
  try {
    return decodeURIComponent(raw).trim()
  } catch {
    return null
  }
}

function unknown() {
  return new Response(null, {
    status: 307,
    headers: { location: '/q/unknown', 'cache-control': 'no-store' },
  })
}
