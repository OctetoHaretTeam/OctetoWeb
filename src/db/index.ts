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

  localClient = new PGlite(LOCAL_DB_PATH)
  return drizzle(localClient, drizzleOptions)
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
