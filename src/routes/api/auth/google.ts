import { createFileRoute } from '@tanstack/react-router'

import { beginGoogleOAuth } from '@/server/auth/oauth'
import { rateLimit } from '@/server/rate-limit'

/**
 * Starts Google sign-in (CLAUDE.md §9).
 *
 * A server route rather than a page: it only ever redirects, so it ships no
 * component and no client JavaScript.
 *
 * Rate-limited to 10 attempts per minute per IP to prevent bots from spamming
 * the OAuth flow.
 */
export const Route = createFileRoute('/api/auth/google')({
  server: {
    handlers: {
      GET: async ({ request }) => {
        // Bot protection: 10 OAuth starts per minute per IP.
        const blocked = rateLimit('oauth-start', request, 10, 60_000)
        if (blocked) return blocked

        const returnTo = new URL(request.url).searchParams.get('returnTo')
        const authorizeUrl = await beginGoogleOAuth(returnTo)

        return new Response(null, {
          status: 302,
          headers: { location: authorizeUrl },
        })
      },
    },
  },
})
