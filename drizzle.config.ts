import { defineConfig } from 'drizzle-kit'

/**
 * `generate` only reads the schema, so it must work without a database — that
 * keeps migration generation possible in CI and for contributors who have not
 * been given Neon credentials. `migrate`, `push` and `studio` do need a real
 * connection and will fail against this placeholder, which is the intent.
 *
 * Bun loads `.env` automatically for `bun run` scripts, so no dotenv import.
 */
const databaseUrl =
  process.env.DATABASE_URL ??
  'postgresql://placeholder:placeholder@localhost:5432/placeholder'

export default defineConfig({
  dialect: 'postgresql',
  schema: './src/db/schema.ts',
  out: './drizzle',
  dbCredentials: { url: databaseUrl },
  casing: 'snake_case',
  strict: true,
  verbose: true,
})
