import { createFileRoute } from '@tanstack/react-router'

import { beginGoogleOAuth } from '@/server/auth/oauth'

/**
 * Starts Google sign-in (CLAUDE.md §9).
 *
 * A server route rather than a page: it only ever redirects, so it ships no
 * component and no client JavaScript.
 */
export const Route = createFileRoute('/api/auth/google')({
  server: {
    handlers: {
      GET: async ({ request }) => {
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
