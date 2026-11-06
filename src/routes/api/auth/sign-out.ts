import { createFileRoute } from '@tanstack/react-router'

import { hasSameOrigin } from '@/server/auth/guards.server'
import { destroyAdminSession } from '@/server/auth/session'

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
        if (!hasSameOrigin(request)) {
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
