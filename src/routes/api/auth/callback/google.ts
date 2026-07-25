import { createFileRoute } from '@tanstack/react-router'

import { isAllowedAdmin } from '@/server/auth/allowlist'
import { completeGoogleOAuth } from '@/server/auth/oauth'
import { createAdminSession, destroyAdminSession } from '@/server/auth/session'

/**
 * Google sign-in callback — CLAUDE.md §9.
 *
 * The rule this implements: if the address is not on `ALLOWED_ADMIN_EMAILS`,
 * destroy the session, return **403**, create no record, and leak nothing
 * about whether that address exists or why it was refused.
 *
 * So every failure below — a bad state, a failed exchange, an unverified
 * address, an address that simply is not allowed — produces the same bare 403.
 * A distinguishable response would turn this endpoint into an oracle for
 * "is this person an OctetoHaret admin?".
 */
export const Route = createFileRoute('/api/auth/callback/google')({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const params = new URL(request.url).searchParams

        // The user declined at Google's consent screen, or Google returned an
        // error. Nothing was established, so send them back to sign in.
        if (params.get('error')) {
          return new Response(null, {
            status: 302,
            headers: { location: '/admin/sign-in?error=cancelled' },
          })
        }

        const result = await completeGoogleOAuth(
          params.get('code'),
          params.get('state'),
        )

        if (!result.ok) return forbidden()

        if (!isAllowedAdmin(result.email, process.env.ALLOWED_ADMIN_EMAILS)) {
          // Destroy any session this browser was holding, then refuse.
          await destroyAdminSession()
          return forbidden()
        }

        await createAdminSession(result.email)

        return new Response(null, {
          status: 302,
          headers: { location: result.returnTo },
        })
      },
    },
  },
})

function forbidden() {
  return new Response('Forbidden', {
    status: 403,
    headers: { 'content-type': 'text/plain; charset=utf-8' },
  })
}
