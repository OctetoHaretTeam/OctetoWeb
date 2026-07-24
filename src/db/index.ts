import { neon } from '@neondatabase/serverless'
import { drizzle } from 'drizzle-orm/neon-http'

import * as schema from './schema'

const databaseUrl = process.env.DATABASE_URL

if (!databaseUrl) {
  throw new Error(
    'DATABASE_URL is not set. Copy .env.example to .env and fill it in.',
  )
}

/**
 * Server-only. Never import this module from a component that ships to the
 * client — reach the database through a server function instead (CLAUDE.md §9).
 */
export const db = drizzle(neon(databaseUrl), {
  schema,
  casing: 'snake_case',
})
