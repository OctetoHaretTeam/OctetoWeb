import { useSession } from '@tanstack/react-start/server'

import { isAllowedAdmin } from './allowlist'

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
  /** When the session was first issued. Bounds the sliding window. */
  issuedAt: number
  /** Refreshed on activity — this is what makes the window slide. */
  lastSeenAt: number
}

export type AdminSession = {
  email: string
}

const SESSION_NAME = 'octeto_admin'
const DEFAULT_MAX_AGE_HOURS = 8
/** `sealSession` requires at least 32 characters of key material. */
const MIN_SECRET_LENGTH = 32

function requireSessionSecret(): string {
  const secret = process.env.SESSION_SECRET

  if (!secret || secret.length < MIN_SECRET_LENGTH) {
    throw new Error(
      `SESSION_SECRET must be set and at least ${MIN_SECRET_LENGTH} characters. Generate one with: openssl rand -base64 32`,
    )
  }

  return secret
}

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

function sessionConfig() {
  return {
    password: requireSessionSecret(),
    name: SESSION_NAME,
    maxAge: sessionMaxAgeSeconds(),
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
    },
  } as const
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
  const session = await useSession<AdminSessionData>(sessionConfig())
  const data = session.data

  if (!data?.email) return null

  if (!isSessionFresh(data, sessionMaxAgeSeconds(), Date.now())) {
    await session.clear()
    return null
  }

  if (!isAllowedAdmin(data.email, process.env.ALLOWED_ADMIN_EMAILS)) {
    await session.clear()
    return null
  }

  return { email: data.email }
}

/** Issues a session. Only ever called after the allowlist check has passed. */
export async function createAdminSession(email: string): Promise<void> {
  const session = await useSession<AdminSessionData>(sessionConfig())
  const now = Date.now()

  await session.update({
    email: email.trim().toLowerCase(),
    issuedAt: now,
    lastSeenAt: now,
  })
}

/**
 * Slides the window forward on activity (§9). Re-writing the session also
 * re-issues the cookie, so `Max-Age` restarts from now.
 */
export async function touchAdminSession(): Promise<void> {
  const session = await useSession<AdminSessionData>(sessionConfig())
  if (!session.data?.email) return

  await session.update((current) => ({ ...current, lastSeenAt: Date.now() }))
}

/** Destroys the session — on sign-out, and on a refused sign-in (§9). */
export async function destroyAdminSession(): Promise<void> {
  const session = await useSession<AdminSessionData>(sessionConfig())
  await session.clear()
}
