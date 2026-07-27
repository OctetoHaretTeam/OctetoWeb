import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'

import {
  award,
  homeSlide,
  newsPost,
  performanceEntry,
  qrCode,
  qrScan,
  season,
  sponsor,
  teamInfo,
  teamMember,
} from './schema'

/**
 * Local database backup and restore.
 *
 * The local PGlite database has already been lost once: the WASM instance
 * aborted mid-use and left a data directory that PGlite could not reopen at
 * all — no repair, no partial read, nothing. The cause was not reproducible,
 * so this exists on the assumption that it can happen again.
 *
 * The dump is plain JSON written OUTSIDE the data directory, so a corrupted
 * database cannot take the backup with it.
 *
 *   bun run db:backup            → db-backups/<timestamp>.json
 *   bun run db:restore <file>    → into a freshly built database
 *
 * None of this applies to Neon, which is a real managed server with its own
 * backups. It is a crutch for developing without one.
 */

const BACKUP_DIR = 'db-backups'

/** Order matters on restore: parents before the rows that reference them. */
const TABLES = [
  ['teamInfo', teamInfo],
  ['season', season],
  ['award', award],
  ['teamMember', teamMember],
  ['performanceEntry', performanceEntry],
  ['newsPost', newsPost],
  ['sponsor', sponsor],
  ['homeSlide', homeSlide],
  ['qrCode', qrCode],
  ['qrScan', qrScan],
] as const

type Dump = Record<string, Array<Record<string, unknown>>>

export async function backup(): Promise<{ file: string; counts: Dump }> {
  const { db } = await import('./index')
  const dump: Dump = {}

  // Sequential, not Promise.all: one call at a time is the whole point of how
  // the local client is wrapped.
  for (const [name, table] of TABLES) {
    dump[name] = (await db.select().from(table)) as Array<
      Record<string, unknown>
    >
  }

  await mkdir(BACKUP_DIR, { recursive: true })
  const stamp = new Date().toISOString().replace(/[:.]/g, '-')
  const file = path.join(BACKUP_DIR, `${stamp}.json`)
  await writeFile(file, JSON.stringify(dump, null, 2), 'utf8')

  return { file, counts: dump }
}

export async function restore(file: string): Promise<Dump> {
  const { db } = await import('./index')
  const dump = JSON.parse(await readFile(file, 'utf8')) as Dump

  for (const [name, table] of TABLES) {
    const rows = dump[name]
    if (!rows?.length) continue

    // Dates come back from JSON as strings; the timestamp columns need Dates.
    const revived = rows.map((row) =>
      Object.fromEntries(
        Object.entries(row).map(([key, value]) => [
          key,
          isTimestampColumn(key) && typeof value === 'string'
            ? new Date(value)
            : value,
        ]),
      ),
    )

    await db.insert(table).values(revived as never).onConflictDoNothing()
  }

  return dump
}

function isTimestampColumn(key: string): boolean {
  return (
    key === 'createdAt' ||
    key === 'updatedAt' ||
    key === 'publishedAt' ||
    key === 'scannedAt'
  )
}

if (import.meta.main) {
  const [command, file] = process.argv.slice(2)
  const { closeDb } = await import('./index')

  if (command === 'restore') {
    if (!file) throw new Error('Usage: bun run src/db/backup.ts restore <file>')
    const dump = await restore(file)
    const lines = Object.entries(dump)
      .map(([name, rows]) => `  ${name.padEnd(18)} ${rows.length}`)
      .join('\n')
    process.stdout.write(`Restored from ${file}:\n${lines}\n`)
  } else {
    const { file: written, counts } = await backup()
    const lines = Object.entries(counts)
      .map(([name, rows]) => `  ${name.padEnd(18)} ${rows.length}`)
      .join('\n')
    process.stdout.write(`Wrote ${written}:\n${lines}\n`)
  }

  await closeDb()
}
