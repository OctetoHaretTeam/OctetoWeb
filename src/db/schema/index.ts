/**
 * Drizzle schema barrel.
 *
 * Tables are defined one file per table in this directory and re-exported
 * here — `drizzle.config.ts` and `src/db/index.ts` both read this module.
 *
 * The full schema is specified in CLAUDE.md §5 and is not implemented yet:
 * season, award, teamMember, performanceEntry, newsPost, sponsor, homeSlide,
 * teamInfo, qrCode, qrScan. There is deliberately no `users` table (§9).
 *
 * Every table carries `id` (uuid), `createdAt`, `updatedAt`. Bilingual text
 * uses `…Ro` / `…En` column pairs where `…En` is nullable.
 */

export {}
