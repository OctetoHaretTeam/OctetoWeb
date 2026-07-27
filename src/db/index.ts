import { neon } from '@neondatabase/serverless'
import {
  type NeonHttpDatabase,
  drizzle as drizzleNeon,
} from 'drizzle-orm/neon-http'

import { LOCAL_DB_PATH } from './local-path'
import * as schema from './schema'

/**
 * The database client. Server-only — never import this from a component that
 * ships to the client; reach the database through a server function (§9).
 *
 * Two drivers, chosen at startup:
 *
 * - **Neon** whenever `DATABASE_URL` is set. This is the real database and the
 *   only one used in staging or production (CLAUDE.md §3).
 * - **PGlite**, an in-process Postgres, when it is not. That exists purely so
 *   the site can be developed and verified before a Neon project exists. It is
 *   a devDependency, is imported dynamically so it never enters a production
 *   bundle, and is refused outright in production.
 */

const databaseUrl = process.env.DATABASE_URL

const drizzleOptions = { schema, casing: 'snake_case' } as const

/** Held so `closeDb()` can shut the local database down without a cast. */
let localClient: import('@electric-sql/pglite').PGlite | undefined

async function createLocalDb() {
  if (process.env.NODE_ENV === 'production') {
    throw new Error(
      'DATABASE_URL is not set. Production must point at Neon — the local PGlite database is for development only.',
    )
  }

  // Dynamic import: keeps @electric-sql/pglite out of any bundle that does not
  // actually take this branch.
  const [{ PGlite }, { drizzle }] = await Promise.all([
    import('@electric-sql/pglite'),
    import('drizzle-orm/pglite'),
  ])

  /*
   * Cached on `globalThis`, not in a module variable.
   *
   * The dev server re-evaluates modules on change, and this one opens a
   * connection at import time — so each reload would open ANOTHER PGlite
   * instance on the same directory. Two instances on one data directory do
   * not share a page cache: writes through one are invisible to the other,
   * and the local database has already been lost once to a WASM abort that
   * left the directory unreadable. A module variable is reset by the reload;
   * `globalThis` is not.
   */
  const store = globalThis as typeof globalThis & {
    __octetoPglite?: import('@electric-sql/pglite').PGlite
  }

  localClient = store.__octetoPglite ?? new PGlite(LOCAL_DB_PATH)
  store.__octetoPglite = localClient

  return drizzle(serializeLocalClient(localClient), drizzleOptions)
}

/**
 * Forces one database call at a time against PGlite.
 *
 * PGlite is a single-threaded Postgres compiled to WebAssembly, and it does
 * not tolerate overlapping calls the way a real server with a connection pool
 * does. Overlapping them aborts the WASM instance — and because the abort can
 * land mid-write, it takes the data directory with it. That is exactly what
 * happened here: adding a home slide ran a write while the home page's five
 * parallel reads were in flight, and the whole local database was lost.
 *
 * Queuing every call removes the concurrency entirely. It costs nothing in
 * practice — these are local, sub-millisecond queries — and it applies only to
 * the development driver. Neon is a real server and needs none of this.
 */
function serializeLocalClient<T extends object>(client: T): T {
  let tail: Promise<unknown> = Promise.resolve()

  const enqueue = <R>(run: () => Promise<R>): Promise<R> => {
    const result = tail.then(run, run)
    // A failed call must not poison the queue for the next one.
    tail = result.then(
      () => undefined,
      () => undefined,
    )
    return result
  }

  const SERIALISED = new Set(['query', 'exec', 'transaction', 'sql'])

  return new Proxy(client, {
    get(target, property, receiver) {
      const value = Reflect.get(target, property, receiver) as unknown

      if (typeof value !== 'function') return value

      const fn = value as (...args: Array<unknown>) => unknown

      if (typeof property === 'string' && SERIALISED.has(property)) {
        return (...args: Array<unknown>) =>
          enqueue(() => Promise.resolve(fn.apply(target, args)))
      }

      return fn.bind(target)
    },
  })
}

/**
 * Releases the local database so a script can exit.
 *
 * PGlite keeps the event loop alive, so a CLI that does not call this appears
 * to hang after its work is done. A no-op against Neon, where the HTTP driver
 * holds nothing open.
 */
export async function closeDb(): Promise<void> {
  await localClient?.close()
}

/**
 * Neon is the type callers see, even when PGlite is what is running.
 *
 * Without this the exported type is a union of two driver types, and TypeScript
 * resolves overloaded builders like `.returning()` against the intersection —
 * which reports "Expected 0 arguments" for a perfectly valid call. Pinning the
 * type to the production driver keeps every call site typed against the thing
 * that actually runs in production; the local driver implements the same query
 * API, so the assertion holds for everything the app does with it.
 */
type Database = NeonHttpDatabase<typeof schema>

export const db: Database = databaseUrl
  ? drizzleNeon(neon(databaseUrl), drizzleOptions)
  : ((await createLocalDb()) as unknown as Database)

/** True when running against the throwaway local database rather than Neon. */
export const isLocalDb = !databaseUrl
