/**
 * In-memory sliding-window rate limiter — bot protection.
 *
 * Keyed by client IP. Each key stores a list of timestamps within the current
 * window. A request is allowed only when the count within the window is below
 * the configured maximum.
 *
 * Storage lives on `globalThis` so it survives Vite HMR reloads (same pattern
 * the PGlite connection uses in `src/db/index.ts`). On Vercel, each serverless
 * invocation gets its own memory, so this is per-isolate — it will not catch a
 * bot that only sends one request per cold start, but it absolutely stops a
 * sustained flood from a single IP, which is the primary threat model for a
 * team portfolio site.
 *
 * Expired entries are swept lazily: every Nth check, timestamps older than the
 * window are pruned and empty keys are removed, so memory stays bounded.
 */

const SWEEP_INTERVAL = 100

type BucketStore = {
  /** IP → array of request timestamps within the window. */
  buckets: Map<string, number[]>
  /** Counter used to trigger periodic sweeps. */
  ops: number
}

/**
 * Returns (or creates) the global store. One store per named limiter so
 * different endpoints track their own limits independently.
 */
function getStore(name: string): BucketStore {
  const g = globalThis as typeof globalThis & {
    __octetoRateLimits?: Map<string, BucketStore>
  }

  g.__octetoRateLimits ??= new Map()

  let store = g.__octetoRateLimits.get(name)
  if (!store) {
    store = { buckets: new Map(), ops: 0 }
    g.__octetoRateLimits.set(name, store)
  }

  return store
}

/** Removes timestamps outside the window and drops empty keys. */
function sweep(store: BucketStore, windowMs: number): void {
  const cutoff = Date.now() - windowMs

  for (const [key, timestamps] of store.buckets) {
    const valid = timestamps.filter((t) => t > cutoff)
    if (valid.length === 0) {
      store.buckets.delete(key)
    } else {
      store.buckets.set(key, valid)
    }
  }
}

/**
 * Extracts the client IP from standard proxy headers.
 *
 * On Vercel, `x-forwarded-for` always contains the real client IP as the first
 * entry. Falls back to `x-real-ip`, then to a constant so a missing header
 * does not bypass the limiter entirely — it just groups all unknown clients
 * into one bucket.
 */
export function clientIp(headers: Headers): string {
  const forwarded = headers.get('x-forwarded-for')
  if (forwarded) {
    const first = forwarded.split(',')[0]?.trim()
    if (first) return first
  }

  return headers.get('x-real-ip') ?? 'unknown'
}

export type RateLimitResult =
  | { allowed: true }
  | { allowed: false; retryAfterSeconds: number }

/**
 * Checks whether a request from `ip` is within the rate limit.
 *
 * @param name   Unique name for this limiter (e.g. `'qr-scan'`).
 * @param ip     Client IP address.
 * @param max    Maximum requests allowed within the window.
 * @param windowMs  Window size in milliseconds.
 */
export function checkRateLimit(
  name: string,
  ip: string,
  max: number,
  windowMs: number,
): RateLimitResult {
  const store = getStore(name)
  const now = Date.now()
  const cutoff = now - windowMs

  // Lazy sweep every N operations.
  store.ops++
  if (store.ops % SWEEP_INTERVAL === 0) {
    sweep(store, windowMs)
  }

  const timestamps = store.buckets.get(ip)

  if (!timestamps) {
    store.buckets.set(ip, [now])
    return { allowed: true }
  }

  // Filter to only timestamps within the current window.
  const recent = timestamps.filter((t) => t > cutoff)

  if (recent.length >= max) {
    // Earliest timestamp in the window determines when the next slot opens.
    const oldest = recent[0]!
    const retryAfterSeconds = Math.ceil((oldest + windowMs - now) / 1000)
    return { allowed: false, retryAfterSeconds }
  }

  recent.push(now)
  store.buckets.set(ip, recent)
  return { allowed: true }
}

/**
 * Convenience: returns a 429 Response if the limit is exceeded, or null if the
 * request is allowed. Designed for use in server route handlers:
 *
 *   const blocked = rateLimit('qr-scan', request, 30, 60_000)
 *   if (blocked) return blocked
 */
export function rateLimit(
  name: string,
  request: Request,
  max: number,
  windowMs: number,
): Response | null {
  const ip = clientIp(request.headers)
  const result = checkRateLimit(name, ip, max, windowMs)

  if (result.allowed) return null

  return new Response('Too Many Requests', {
    status: 429,
    headers: {
      'retry-after': String(result.retryAfterSeconds),
      'content-type': 'text/plain',
    },
  })
}
