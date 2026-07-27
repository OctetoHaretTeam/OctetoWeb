import { createFileRoute } from '@tanstack/react-router'

import { withLocale } from '@/i18n/locale'
import {
  countryFromHeaders,
  localeForScan,
  lookupCode,
  recordScan,
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
 */
export const Route = createFileRoute('/q/$code')({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const { pathname } = new URL(request.url)
        const code = decodeURIComponent(
          pathname.replace(/^\/q\/?/, ''),
        ).trim()

        if (!code) return unknown()

        const resolved = await lookupCode(code)

        // A retired code is treated exactly like an unknown one: the person
        // scanning gets a designed page either way, never a raw 404 (§6).
        if (!resolved || !resolved.isActive) return unknown()

        // Awaited: see recordScan for why the fire-and-forget version was
        // removed. A single insert costs a few milliseconds.
        await recordScan(resolved.id, countryFromHeaders(request.headers))

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

function unknown() {
  return new Response(null, {
    status: 307,
    headers: { location: '/q/unknown', 'cache-control': 'no-store' },
  })
}
