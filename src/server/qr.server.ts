import { eq } from 'drizzle-orm'

import { db } from '@/db'
import { qrCode, qrScan } from '@/db/schema'
import { DEFAULT_LOCALE, type Locale, parseAcceptLanguage } from '@/i18n/locale'
import { isLocale } from '@/i18n/locale'
import { LOCALE_COOKIE } from '@/i18n/locale'

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
  const cookie = cookieHeader
    ?.split(';')
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${LOCALE_COOKIE}=`))
    ?.slice(LOCALE_COOKIE.length + 1)

  if (isLocale(cookie)) return cookie

  return parseAcceptLanguage(headers.get('accept-language')) ?? DEFAULT_LOCALE
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
 *
 * Deliberately not awaited by the caller: §6 requires the write not to block
 * the redirect. On a serverless host that makes it best-effort, which is the
 * right trade — a lost row is better than a judge waiting on a database.
 */
export function recordScan(qrCodeId: string, country: string | null): void {
  void db
    .insert(qrScan)
    .values({ qrCodeId, country })
    .catch(() => {
      // A failed scan log must never surface to the person scanning.
    })
}
