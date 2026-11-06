import { getCookie, setCookie } from '@tanstack/react-start/server'
import {
  type IronSession,
  type SessionOptions,
  getIronSession,
} from 'iron-session'

/**
 * A sealed (encrypted and signed) cookie session on the current request —
 * CLAUDE.md §9.
 *
 * TanStack Start 1.169 removed its built-in `useSession`; its own docs point
 * to iron-session, wired to Start's cookie helpers exactly like this. Both the
 * admin session and the short-lived OAuth attempt go through here.
 *
 * iron-session checks `ttl` when unsealing and renews it on every `save()`,
 * which is what makes the admin window slide.
 */
export function openSealedSession<T extends object>(
  options: SessionOptions,
): Promise<IronSession<T>> {
  return getIronSession<T>({ read: getCookie, write: setCookie }, options)
}

/** `sealData` requires at least 32 characters of key material. */
const MIN_SECRET_LENGTH = 32

export function requireSessionSecret(): string {
  const secret = process.env.SESSION_SECRET

  if (!secret || secret.length < MIN_SECRET_LENGTH) {
    throw new Error(
      `SESSION_SECRET must be set and at least ${MIN_SECRET_LENGTH} characters. Generate one with: openssl rand -base64 32`,
    )
  }

  return secret
}

/** The attributes every session cookie on this site shares (§8, §9). */
export function sessionCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
  } as const
}
