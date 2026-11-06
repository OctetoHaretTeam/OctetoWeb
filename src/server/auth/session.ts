import { isAllowedAdmin } from './allowlist'
import {
  openSealedSession,
  requireSessionSecret,
  sessionCookieOptions,
} from './sealed-session'

/**
 * The admin session — CLAUDE.md §9.
 *
 * There is no sessions table and no users table. The session is a sealed,
 * signed cookie carrying only the administrator's email, so signing in creates
 * no record anywhere.
 *
 * That is a deliberate trade: a stateless session cannot be revoked
 * server-side. It is acceptable here because the only way to hold one is to be
 * on `ALLOWED_ADMIN_EMAILS`, and **the allowlist is re-checked on every
 * request** (see `readAdminSession`). Removing an address from the env var
 * therefore locks that person out immediately, which is the revocation path
 * that actually matters.
 */

export type AdminSessionData = {
  email: string
  /** When the session was first issued. Informational; expiry uses `lastSeenAt`. */
  issuedAt: number
  /** Refreshed on activity — this is what makes the window slide. */
  lastSeenAt: number
}

export type AdminSession = {
  email: string
}

const SESSION_NAME = 'octeto_admin'
const DEFAULT_MAX_AGE_HOURS = 8

/**
 * Session lifetime. Eight hours by default (§9) — long enough to survive a
 * competition day, and configurable rather than hardcoded because a shorter
 * lifetime would otherwise destroy half-written posts.
 */
export function sessionMaxAgeSeconds(): number {
  const raw = process.env.SESSION_MAX_AGE_HOURS
  const hours = raw ? Number.parseFloat(raw) : DEFAULT_MAX_AGE_HOURS

  return Math.round(
    (Number.isFinite(hours) && hours > 0 ? hours : DEFAULT_MAX_AGE_HOURS) *
      60 *
      60,
  )
}

/**
 * `ttl` is renewed on every `save()`, so the seal and the cookie's Max-Age
 * both slide with activity. `isSessionFresh` re-checks `lastSeenAt` on top, so
 * the window is enforced by data the server sealed, not only by the browser.
 */
function sessionOptions() {
  return {
    cookieName: SESSION_NAME,
    password: requireSessionSecret(),
    ttl: sessionMaxAgeSeconds(),
    cookieOptions: sessionCookieOptions(),
  }
}

function openAdminSession() {
  return openSealedSession<AdminSessionData>(sessionOptions())
}

/**
 * Decides whether a stored session is still valid, given the moment it is
 * being read. Pure so the sliding-window rules can be tested directly.
 */
export function isSessionFresh(
  data: { lastSeenAt?: number } | undefined | null,
  maxAgeSeconds: number,
  now: number,
): boolean {
  if (!data?.lastSeenAt) return false

  const age = now - data.lastSeenAt
  // A timestamp in the future means a tampered or clock-skewed cookie.
  if (age < 0) return false

  return age <= maxAgeSeconds * 1000
}

/**
 * Reads the current admin session, or null.
 *
 * Three things must hold, and all three are re-checked on every request:
 * the cookie unseals, the sliding window has not lapsed, and the email is
 * STILL on the allowlist. The last one is what makes removing someone from
 * `ALLOWED_ADMIN_EMAILS` take effect immediately.
 */
export async function readAdminSession(): Promise<AdminSession | null> {
  const session = await openAdminSession()
  const { email } = session

  if (!email) return null

  if (!isSessionFresh(session, sessionMaxAgeSeconds(), Date.now())) {
    session.destroy()
    return null
  }

  if (!isAllowedAdmin(email, process.env.ALLOWED_ADMIN_EMAILS)) {
    session.destroy()
    return null
  }

  return { email }
}

/** Issues a session. Only ever called after the allowlist check has passed. */
export async function createAdminSession(email: string): Promise<void> {
  const session = await openAdminSession()
  const now = Date.now()

  session.email = email.trim().toLowerCase()
  session.issuedAt = now
  session.lastSeenAt = now
  await session.save()
}

/**
 * Slides the window forward on activity (§9). Re-writing the session also
 * re-issues the cookie, so `Max-Age` restarts from now.
 */
export async function touchAdminSession(): Promise<void> {
  const session = await openAdminSession()
  if (!session.email) return

  session.lastSeenAt = Date.now()
  await session.save()
}

/** Destroys the session — on sign-out, and on a refused sign-in (§9). */
export async function destroyAdminSession(): Promise<void> {
  const session = await openAdminSession()
  session.destroy()
}
