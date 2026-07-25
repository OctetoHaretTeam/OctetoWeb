import { createMiddleware } from '@tanstack/react-start'
import { getRequest, getRequestUrl } from '@tanstack/react-start/server'

import { type AdminSession, readAdminSession, touchAdminSession } from './session'

/**
 * Authorization for server functions — CLAUDE.md §9.
 *
 * The route guard in `/admin` is for user experience. It is NOT a security
 * boundary: a server function is an endpoint reachable on its own, whether or
 * not the route that normally calls it was ever loaded. So every mutating
 * server function re-verifies here, and never trusts the client.
 */

export class UnauthorizedError extends Error {
  readonly status = 403

  constructor() {
    // Deliberately uninformative. §9: leak nothing about whether an address
    // exists or why access was refused.
    super('Forbidden')
    this.name = 'UnauthorizedError'
  }
}

/**
 * Verifies the Origin header on anything that is not a read.
 *
 * `SameSite=Lax` already blocks most cross-site POSTs, but not one from a
 * sibling subdomain, so the origin is compared in full — scheme, host and
 * port. Comparing the host alone would let `http://` pass a check meant for
 * `https://`.
 */
export const csrfMiddleware = createMiddleware().server(async ({ next }) => {
  const request = getRequest()

  if (request.method !== 'GET' && request.method !== 'HEAD') {
    const origin = request.headers.get('origin')
    const expected = getRequestUrl({
      xForwardedHost: true,
      xForwardedProto: true,
    }).origin

    if (!origin || safeOrigin(origin) !== expected) {
      throw new UnauthorizedError()
    }
  }

  return next()
})

/**
 * Requires a valid admin session, and slides the 8-hour window forward.
 *
 * Attach to every server function that reads or writes admin-only data:
 *
 *   createServerFn({ method: 'POST' })
 *     .middleware([adminMiddleware])
 *     .handler(async ({ context }) => { context.admin.email })
 */
export const adminMiddleware = createMiddleware({ type: 'function' })
  .middleware([csrfMiddleware])
  .server(async ({ next }) => {
    const admin = await requireAdmin()
    return next({ context: { admin } })
  })

/**
 * Direct form, for a handler that needs the check without the middleware
 * chain. Throws rather than returning null so it cannot be ignored by accident.
 */
export async function requireAdmin(): Promise<AdminSession> {
  const admin = await readAdminSession()
  if (!admin) throw new UnauthorizedError()

  // Activity refreshes the window (§9).
  await touchAdminSession()

  return admin
}

function safeOrigin(value: string): string | null {
  try {
    return new URL(value).origin
  } catch {
    return null
  }
}
