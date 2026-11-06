import { eq } from 'drizzle-orm'

import { db, isLocalDb } from '@/db'
import { qrCode, qrScan } from '@/db/schema'
import {
  LOCALE_COOKIE,
  type Locale,
  cookieValue,
  pickLocale,
} from '@/i18n/locale'

/**
 * QR scan resolution — CLAUDE.md §6.
 *
 * The hottest route in the app: a lookup and a redirect, nothing else.
 */

/** Two-letter country, from whichever edge header the host provides. */
export function countryFromHeaders(headers: Headers): string | null {
  const raw =
    headers.get('x-vercel-ip-country') ??
    headers.get('cf-ipcountry') ??
    headers.get('x-country-code')

  if (!raw) return null
  const code = raw.trim().toUpperCase()

  // "XX" and "T1" are placeholders some networks send for unknown or Tor.
  if (!/^[A-Z]{2}$/.test(code) || code === 'XX' || code === 'T1') return null

  return code
}

/**
 * Resolves the locale for a scan.
 *
 * The `Accept-Language` step is the one that matters: a judge at an
 * international event scanning a shirt is usually an English speaker and
 * should land on English without touching the toggle (§6).
 */
export function localeForScan(headers: Headers, cookieHeader: string | null): Locale {
  return pickLocale(
    cookieValue(cookieHeader, LOCALE_COOKIE),
    headers.get('accept-language'),
  )
}

export type ResolvedCode = {
  id: string
  targetPath: string
  isActive: boolean
}

export async function lookupCode(code: string): Promise<ResolvedCode | null> {
  const rows = await db
    .select({
      id: qrCode.id,
      targetPath: qrCode.targetPath,
      isActive: qrCode.isActive,
    })
    .from(qrCode)
    .where(eq(qrCode.code, code))
    .limit(1)

  return rows[0] ?? null
}

/**
 * Records a scan.
 *
 * Stores only the code, the time, and a coarse country. **No IP, no user
 * agent, no precise location, no device identifier** (§6, §8) — this is the
 * site's only telemetry and it holds nothing personal.
 */
async function recordScan(qrCodeId: string, country: string | null): Promise<void> {
  try {
    await db.insert(qrScan).values({ qrCodeId, country })
  } catch {
    // A failed scan log must never surface to the person scanning.
  }
}

type BackgroundCapable = Request & {
  waitUntil?: (promise: Promise<unknown>) => void
}

/**
 * Logs a scan without holding the redirect (§6), whenever that is safe.
 *
 * On Neon the insert is handed to the host's `waitUntil`, so the 307 goes out
 * immediately and the function stays alive until the write lands. A bare
 * un-awaited promise is not enough on a serverless host — the instance can be
 * frozen the moment the response is sent, and the scan is lost.
 *
 * Awaited instead in two cases: when the runtime offers no `waitUntil`, and
 * against the local PGlite database, where an overlapping loose write is what
 * corrupted the whole data directory once already.
 */
export async function logScan(
  request: Request,
  qrCodeId: string,
  country: string | null,
): Promise<void> {
  const pending = recordScan(qrCodeId, country)
  const { waitUntil } = request as BackgroundCapable

  if (!isLocalDb && typeof waitUntil === 'function') {
    waitUntil.call(request, pending)
    return
  }

  await pending
}
