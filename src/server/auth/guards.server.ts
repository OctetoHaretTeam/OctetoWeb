import { getRequest, getRequestUrl } from '@tanstack/react-start/server'

import { UnauthorizedError } from './errors'
import { type AdminSession, readAdminSession, touchAdminSession } from './session'

/**
 * The actual checks behind `adminMiddleware` — CLAUDE.md §9.
 *
 * `.server.ts`, so import protection refuses it in the client build. The
 * middleware reaches it with a dynamic import from inside its `.server()`
 * callback, which is stripped client-side along with everything it pulls in.
 */

/**
 * Verifies the Origin header on anything that is not a read.
 *
 * `SameSite=Lax` already blocks most cross-site POSTs, but not one from a
 * sibling subdomain, so the origin is compared in full — scheme, host and
 * port. Comparing the host alone would let `http://` pass a check meant for
 * `https://`.
 */
export function assertSameOrigin(): void {
  const request = getRequest()

  if (request.method === 'GET' || request.method === 'HEAD') return

  const origin = request.headers.get('origin')
  const expected = getRequestUrl({
    xForwardedHost: true,
    xForwardedProto: true,
  }).origin

  if (!origin || safeOrigin(origin) !== expected) {
    throw new UnauthorizedError()
  }
}

/**
 * Requires a valid admin session, and slides the 8-hour window forward.
 * Throws rather than returning null, so it cannot be ignored by accident.
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
