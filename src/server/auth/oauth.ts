import crypto from 'node:crypto'

import { useSession } from '@tanstack/react-start/server'
import { z } from 'zod'

/**
 * Google sign-in — CLAUDE.md §9.
 *
 * Authorization-code flow with `state` and PKCE. Both are stored in a sealed,
 * short-lived cookie keyed to this one attempt, so a callback that did not
 * originate from `beginGoogleOAuth` is rejected before any code is exchanged.
 *
 * No user record is ever created. All this flow produces is a verified email
 * address, which `session.ts` then checks against the allowlist.
 */

const AUTHORIZE_ENDPOINT = 'https://accounts.google.com/o/oauth2/v2/auth'
const TOKEN_ENDPOINT = 'https://oauth2.googleapis.com/token'
const USERINFO_ENDPOINT = 'https://openidconnect.googleapis.com/v1/userinfo'

const OAUTH_COOKIE = 'octeto_oauth'
const OAUTH_TTL_SECONDS = 600

type OAuthAttempt = {
  state: string
  verifier: string
  /** Where to land after a successful sign-in. Always a site-relative path. */
  returnTo: string
}

export function base64url(input: Buffer): string {
  return input.toString('base64url')
}

/**
 * Rejects anything that is not a site-relative path, so `?returnTo=` cannot be
 * used to bounce a signed-in administrator to another origin.
 */
export function safeReturnPath(value: string | null | undefined): string {
  if (!value) return '/admin'
  // Must start with a single slash: `//evil.com` and `https://evil.com` are
  // both absolute despite the leading characters looking relative.
  if (!/^\/(?!\/)/.test(value)) return '/admin'

  // `/admin` exactly, or a path beneath it. A bare `startsWith('/admin')`
  // would also accept `/administrator-evil`, which is a different page.
  if (!/^\/admin([/?#]|$)/.test(value)) return '/admin'

  return value
}

function requireEnv(name: string): string {
  const value = process.env[name]
  if (!value) {
    throw new Error(
      `${name} is not set. Admin sign-in cannot work without it — see .env.example.`,
    )
  }
  return value
}

function oauthSessionConfig() {
  const password = process.env.SESSION_SECRET
  if (!password || password.length < 32) {
    throw new Error('SESSION_SECRET must be set and at least 32 characters.')
  }

  return {
    password,
    name: OAUTH_COOKIE,
    maxAge: OAUTH_TTL_SECONDS,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
    },
  } as const
}

/**
 * Starts the flow: mints `state` and a PKCE pair, stores them, and returns the
 * URL to send the browser to.
 */
export async function beginGoogleOAuth(returnTo?: string | null): Promise<string> {
  const state = base64url(crypto.randomBytes(32))
  const verifier = base64url(crypto.randomBytes(32))
  const challenge = base64url(
    crypto.createHash('sha256').update(verifier).digest(),
  )

  const session = await useSession<OAuthAttempt>(oauthSessionConfig())
  await session.update({ state, verifier, returnTo: safeReturnPath(returnTo) })

  const url = new URL(AUTHORIZE_ENDPOINT)
  url.searchParams.set('response_type', 'code')
  url.searchParams.set('client_id', requireEnv('GOOGLE_CLIENT_ID'))
  url.searchParams.set('redirect_uri', requireEnv('GOOGLE_REDIRECT_URI'))
  url.searchParams.set('scope', 'openid email')
  url.searchParams.set('state', state)
  url.searchParams.set('code_challenge', challenge)
  url.searchParams.set('code_challenge_method', 'S256')
  // The site stores nothing about the account, so there is no refresh token to
  // want and no reason to ask for offline access.
  url.searchParams.set('access_type', 'online')
  url.searchParams.set('prompt', 'select_account')

  return url.toString()
}

const tokenResponseSchema = z.object({
  access_token: z.string().min(1),
})

const userInfoSchema = z.object({
  email: z.string().min(1),
  email_verified: z.boolean().optional(),
})

export type OAuthResult =
  | { ok: true; email: string; returnTo: string }
  | { ok: false; reason: 'state' | 'exchange' | 'profile' | 'unverified' }

/**
 * Completes the flow and returns the verified email.
 *
 * This function deliberately does NOT consult the allowlist — it only
 * establishes *who* the caller is. Whether that person may administer the site
 * is decided in one place (`isAllowedAdmin`), by the caller.
 */
export async function completeGoogleOAuth(
  code: string | null,
  state: string | null,
): Promise<OAuthResult> {
  const session = await useSession<OAuthAttempt>(oauthSessionConfig())
  const attempt = session.data
  // One attempt per cookie: clear it immediately so a code cannot be replayed.
  await session.clear()

  if (!code || !state || !attempt?.state || !attempt.verifier) {
    return { ok: false, reason: 'state' }
  }

  if (!timingSafeEqual(state, attempt.state)) {
    return { ok: false, reason: 'state' }
  }

  const tokenResponse = await fetch(TOKEN_ENDPOINT, {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      client_id: requireEnv('GOOGLE_CLIENT_ID'),
      client_secret: requireEnv('GOOGLE_CLIENT_SECRET'),
      redirect_uri: requireEnv('GOOGLE_REDIRECT_URI'),
      code_verifier: attempt.verifier,
    }),
  })

  if (!tokenResponse.ok) return { ok: false, reason: 'exchange' }

  const token = tokenResponseSchema.safeParse(await tokenResponse.json())
  if (!token.success) return { ok: false, reason: 'exchange' }

  const profileResponse = await fetch(USERINFO_ENDPOINT, {
    headers: { authorization: `Bearer ${token.data.access_token}` },
  })

  if (!profileResponse.ok) return { ok: false, reason: 'profile' }

  const profile = userInfoSchema.safeParse(await profileResponse.json())
  if (!profile.success) return { ok: false, reason: 'profile' }

  // An unverified address would let anyone claim an admin's email on a Google
  // account they control.
  if (profile.data.email_verified === false) {
    return { ok: false, reason: 'unverified' }
  }

  return {
    ok: true,
    email: profile.data.email.trim().toLowerCase(),
    returnTo: safeReturnPath(attempt.returnTo),
  }
}

/** Constant-time comparison, so a mismatched state cannot be probed by timing. */
function timingSafeEqual(a: string, b: string): boolean {
  const left = Buffer.from(a)
  const right = Buffer.from(b)
  if (left.length !== right.length) return false
  return crypto.timingSafeEqual(left, right)
}
