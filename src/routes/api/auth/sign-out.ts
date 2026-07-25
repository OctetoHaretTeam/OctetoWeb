import { createFileRoute } from '@tanstack/react-router'

import { destroyAdminSession } from '@/server/auth/session'
import { getRequestUrl } from '@tanstack/react-start/server'

/**
 * Signs out — CLAUDE.md §9.
 *
 * POST only. A sign-out reachable by GET can be triggered by any image tag on
 * any page, and the Origin check below is what stops another site posting the
 * form on the administrator's behalf.
 */
export const Route = createFileRoute('/api/auth/sign-out')({
  server: {
    handlers: {
      /**
       * Without this, a GET falls through to the SPA shell and answers 200 with
       * an HTML page — a soft 404 on an endpoint that should not be a page at
       * all. It does not sign anyone out (there is no GET handler to do so),
       * but answering correctly is cheaper than explaining why 200 was fine.
       */
      GET: async () =>
        new Response('Method Not Allowed', {
          status: 405,
          headers: { allow: 'POST' },
        }),

      POST: async ({ request }) => {
        const origin = request.headers.get('origin')
        const expected = getRequestUrl({
          xForwardedHost: true,
          xForwardedProto: true,
        }).origin

        if (!origin || safeOrigin(origin) !== expected) {
          return new Response('Forbidden', { status: 403 })
        }

        await destroyAdminSession()

        return new Response(null, {
          status: 303,
          headers: { location: '/admin/sign-in' },
        })
      },
    },
  },
})

function safeOrigin(value: string): string | null {
  try {
    return new URL(value).origin
  } catch {
    return null
  }
}
