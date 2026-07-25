import { readFileSync, readdirSync } from 'node:fs'
import path from 'node:path'

import { PGlite } from '@electric-sql/pglite'

import { LOCAL_DB_PATH } from './local-path'

/**
 * Creates the local development database — CLAUDE.md §3 note.
 *
 * Applies the committed migrations in `drizzle/` to an in-process Postgres and
 * then runs the seed. This is a development convenience only: Neon is the real
 * database, and `drizzle-kit migrate` is what runs against it.
 *
 *   bun run db:local
 *
 * Safe to re-run — the schema is recreated from scratch and the seed is keyed
 * on unique columns.
 */

const MIGRATIONS_DIR = 'drizzle'

async function main() {
  if (process.env.DATABASE_URL) {
    throw new Error(
      'DATABASE_URL is set, so this would not be the database the app uses. Unset it to build the local database, or run db:migrate against Neon instead.',
    )
  }

  const client = new PGlite(LOCAL_DB_PATH)
  await client.waitReady

  // Start clean so a changed migration cannot leave a half-old schema behind.
  await client.exec('drop schema public cascade; create schema public;')

  const files = readdirSync(MIGRATIONS_DIR)
    .filter((file) => file.endsWith('.sql'))
    .sort()

  if (files.length === 0) {
    throw new Error(
      `No migrations found in ${MIGRATIONS_DIR}. Run "bun run db:generate" first.`,
    )
  }

  let applied = 0
  for (const file of files) {
    const sql = readFileSync(path.join(MIGRATIONS_DIR, file), 'utf8')
    for (const statement of sql.split('--> statement-breakpoint')) {
      const trimmed = statement.trim()
      if (trimmed) await client.exec(trimmed)
    }
    applied++
  }

  const tables = await client.query<{ count: number }>(
    `select count(*)::int as count from information_schema.tables where table_schema = 'public'`,
  )

  await client.close()

  return { applied, tables: tables.rows[0]?.count ?? 0 }
}

const result = await main()
process.stdout.write(
  `Local database ready at ${LOCAL_DB_PATH} — ${result.applied} migration(s), ${result.tables} tables.\nRun "bun run db:seed" to add placeholder content.\n`,
)
