import {
  award,
  homeSlide,
  newsPost,
  performanceEntry,
  qrCode,
  season,
  sponsor,
  teamInfo,
  teamMember,
} from './schema'

/**
 * Seed data — CLAUDE.md §13.
 *
 * Two rules govern this file:
 *
 *   1. Nothing here is invented. Every factual value is either stated in
 *      CLAUDE.md §1 or carries the PLACEHOLDER marker. There are no invented
 *      member names, sponsors, robot specs, outreach numbers or award results.
 *      A fabricated statistic on a Connect team's site is a real problem.
 *   2. Anything provisional is listed in PROVISIONAL below rather than being
 *      quietly inlined, so it can be found and corrected in one place.
 *
 * Re-running is safe: every table has a unique key that `onConflictDoNothing`
 * can match on, so this tops up a database rather than duplicating it. That
 * includes `award`, which needed a unique index added for the purpose — see
 * `award_unique_per_event_idx` in `schema.ts`.
 */

export const PLACEHOLDER = '[PLACEHOLDER — confirm with team]'

/**
 * Confirmed dates, from press coverage supplied by the team.
 *
 * These are plain `YYYY-MM-DD` strings, not `Date` objects: the `date` columns
 * use Drizzle's string mode, so a `Date` would be converted through the local
 * timezone and can land a day early or late.
 */
const CONFIRMED = {
  /** "Pe 5-6 aprilie 2025 la Chișinău" — two-day event, first day used. */
  nationals2025: '2025-04-05',
  /** "Pe 21 și 22 februarie 2026" — two-day event, first day used. */
  nationals2026: '2026-02-21',
} as const

/**
 * NOT verified. Must be corrected before launch.
 *
 * `foundedDate` and the season spans are NOT NULL columns, so something has to
 * go in them. Rather than inline a plausible-looking date, each one is parked
 * here where it can be found and fixed in one place (CLAUDE.md §15).
 */
const PROVISIONAL = {
  /**
   * Press says "Așa a luat naștere, în ianuarie 2024" — the month, not the
   * day. January 1 is a bad guess and the team almost certainly remembers the
   * actual first meeting. ASK THE TEAM.
   */
  foundedDate: '2024-01-01',
  /** Season spans are unknown; only the game names are verified. */
  season2024StartDate: '2024-09-01',
  season2025StartDate: '2025-09-01',
} as const

export function buildSeedData() {
  // ── teamInfo ──────────────────────────────────────────────────────────────
  // School, city, country and social handles are stated in CLAUDE.md §1.
  // The origin story, email and phone are not, so they stay marked.
  const teamInfoRow = {
    id: 1 as const,
    originStoryRo: PLACEHOLDER,
    originStoryEn: null,
    gallery: [],
    foundedDate: PROVISIONAL.foundedDate,
    schoolName: 'IPLT „Spiru Haret"',
    city: 'Chișinău',
    country: 'MD',
    // example.com is IANA-reserved, so this cannot accidentally reach anyone.
    contactEmail: 'placeholder@example.com',
    phone: null,
    socialLinks: {
      instagram: 'https://www.instagram.com/octetoharet.ftc/',
      tiktok: 'https://www.tiktok.com/@octetoharet',
      instagramFll: 'https://www.instagram.com/octetoharet.fll/',
    },
    mapEmbedLat: null,
    mapEmbedLng: null,
  }

  // ── seasons ───────────────────────────────────────────────────────────────
  // Only the DECODE season is named in CLAUDE.md. The earlier season exists
  // because the 2025 award has to hang off something, but its name and game
  // are unknown — do not guess the FTC game title.
  const seasons = [
    {
      slug: '2024-25-into-the-deep',
      name: PLACEHOLDER,
      gameName: 'INTO THE DEEP',
      startDate: PROVISIONAL.season2024StartDate,
      endDate: null,
      descriptionRo: PLACEHOLDER,
      descriptionEn: null,
      gallery: [],
      isCurrent: false,
      displayOrder: 0,
    },
    {
      slug: '2025-26-decode',
      name: PLACEHOLDER,
      gameName: 'DECODE',
      startDate: PROVISIONAL.season2025StartDate,
      endDate: null,
      descriptionRo: PLACEHOLDER,
      descriptionEn: null,
      gallery: [],
      isCurrent: true,
      displayOrder: 1,
    },
  ]

  // ── awards ────────────────────────────────────────────────────────────────
  // Both are stated verbatim in CLAUDE.md §1. Only the dates are provisional.
  const awards = [
    {
      seasonSlug: '2024-25-into-the-deep',
      nameRo: 'Connect Award',
      nameEn: 'Connect Award',
      eventName: 'FTC Moldova Nationals 2025',
      eventDate: CONFIRMED.nationals2025,
      placement: null,
      notesRo: null,
      notesEn: null,
      isFeatured: true,
    },
    {
      seasonSlug: '2025-26-decode',
      nameRo: 'Connect Award',
      nameEn: 'Connect Award',
      eventName: 'FTC Moldova Nationals 2026 (DECODE)',
      eventDate: CONFIRMED.nationals2026,
      placement: null,
      notesRo: null,
      notesEn: null,
      isFeatured: true,
    },
  ]

  // ── team members ──────────────────────────────────────────────────────────
  // One row per branch so the roster and the branch split can be rendered.
  // Names are NOT invented — the roster is an open question (§15.3). Consent
  // flags stay at their safe defaults, so no photo and no surname would be
  // exposed even if a photo were attached (§8).
  const members = (['tech', 'non_tech', 'mentor', 'volunteer'] as const).map(
    (branch, i) => ({
      slug: `placeholder-${branch.replace('_', '-')}`,
      name: PLACEHOLDER,
      roleRo: PLACEHOLDER,
      roleEn: null,
      branch,
      descriptionRo: null,
      descriptionEn: null,
      image: null,
      instagramUrl: null,
      // Structural, not a claim about anyone: 1, 2, 4, 8.
      octetIndex: 1 << i,
      isActive: true,
      displayOrder: i,
      photoConsent: false,
      fullNamePublic: false,
    }),
  )

  // ── performance entries ───────────────────────────────────────────────────
  // One per branch so both halves of §7.3 have something to render.
  // `metrics` is null: outreach numbers are never invented.
  const performanceEntries = [
    {
      slug: 'placeholder-tech',
      branch: 'tech' as const,
      category: 'innovation' as const,
      titleRo: PLACEHOLDER,
      titleEn: null,
      summaryRo: PLACEHOLDER,
      summaryEn: null,
      bodyRo: PLACEHOLDER,
      bodyEn: null,
      gallery: [],
      date: PROVISIONAL.season2025StartDate,
      metrics: null,
      isFeatured: false,
      displayOrder: 0,
    },
    {
      slug: 'placeholder-non-tech',
      branch: 'non_tech' as const,
      category: 'outreach' as const,
      titleRo: PLACEHOLDER,
      titleEn: null,
      summaryRo: PLACEHOLDER,
      summaryEn: null,
      bodyRo: PLACEHOLDER,
      bodyEn: null,
      gallery: [],
      date: PROVISIONAL.season2025StartDate,
      metrics: null,
      isFeatured: false,
      displayOrder: 0,
    },
  ]

  // ── news ──────────────────────────────────────────────────────────────────
  // publishedAt stays null, so this is a draft and never reaches a public
  // route even if the seed is run against production by accident (§10).
  const newsPosts = [
    {
      slug: 'placeholder-news',
      titleRo: PLACEHOLDER,
      titleEn: null,
      excerptRo: PLACEHOLDER,
      excerptEn: null,
      bodyRo: PLACEHOLDER,
      bodyEn: null,
      gallery: [],
      publishedAt: null,
      authorMemberId: null,
    },
  ]

  // ── QR codes ──────────────────────────────────────────────────────────────
  // The non-member codes are specified directly in CLAUDE.md §6. Member codes
  // (`m-<memberSlug>`) are deliberately omitted: they depend on real slugs.
  // targetPath is stored WITHOUT a locale prefix — the resolver adds it.
  const qrCodes = [
    { code: 'pit', label: 'Panou pit / banner', targetPath: '/' },
    { code: 'robot', label: 'Plăcuță robot', targetPath: '/performance/tech' },
    { code: 'sponsor', label: 'Pachet și scrisori sponsori', targetPath: '/sponsors' },
    { code: 'portfolio', label: 'Copertă portofoliu', targetPath: '/seasons' },
    { code: 'outreach', label: 'Fișe atelier outreach', targetPath: '/performance/non-tech' },
  ].map((c) => ({ ...c, isActive: true, printedOn: null }))

  return {
    teamInfo: teamInfoRow,
    seasons,
    awards,
    members,
    performanceEntries,
    newsPosts,
    qrCodes,
    /**
     * Intentionally empty. Sponsors and home slides are the record's own
     * image — seeding them would mean inventing a sponsor name or pointing at
     * an image that does not exist. Both are open questions (§15.4).
     */
    sponsors: [] as (typeof sponsor.$inferInsert)[],
    homeSlides: [] as (typeof homeSlide.$inferInsert)[],
  }
}

async function main() {
  // Imported lazily so `buildSeedData` can be exercised in a test without a
  // database — `./index` opens a connection at module load.
  const { db, isLocalDb, closeDb } = await import('./index')
  const data = buildSeedData()

  await db.insert(teamInfo).values(data.teamInfo).onConflictDoNothing()

  await db.insert(season).values(data.seasons).onConflictDoNothing()

  const seasonRows = await db
    .select({ id: season.id, slug: season.slug })
    .from(season)
  const seasonIdBySlug = new Map(seasonRows.map((s) => [s.slug, s.id]))

  const awardRows = data.awards.flatMap(({ seasonSlug, ...rest }) => {
    const seasonId = seasonIdBySlug.get(seasonSlug)
    return seasonId ? [{ ...rest, seasonId }] : []
  })
  if (awardRows.length > 0) {
    await db.insert(award).values(awardRows).onConflictDoNothing()
  }

  await db.insert(teamMember).values(data.members).onConflictDoNothing()
  await db
    .insert(performanceEntry)
    .values(data.performanceEntries)
    .onConflictDoNothing()
  await db.insert(newsPost).values(data.newsPosts).onConflictDoNothing()
  await db.insert(qrCode).values(data.qrCodes).onConflictDoNothing()

  if (data.sponsors.length > 0) {
    await db.insert(sponsor).values(data.sponsors).onConflictDoNothing()
  }
  if (data.homeSlides.length > 0) {
    await db.insert(homeSlide).values(data.homeSlides).onConflictDoNothing()
  }

  const counts = {
    seasons: (await db.select({ id: season.id }).from(season)).length,
    awards: (await db.select({ id: award.id }).from(award)).length,
    members: (await db.select({ id: teamMember.id }).from(teamMember)).length,
    performance: (
      await db.select({ id: performanceEntry.id }).from(performanceEntry)
    ).length,
    news: (await db.select({ id: newsPost.id }).from(newsPost)).length,
    qrCodes: (await db.select({ id: qrCode.id }).from(qrCode)).length,
  }

  await closeDb()

  return { counts, target: isLocalDb ? 'local PGlite' : 'Neon' }
}

// Only run when executed directly, so importing `buildSeedData` in a test does
// not hit the database.
if (import.meta.main) {
  const { counts, target } = await main()
  const rows = Object.entries(counts)
    .map(([table, n]) => `  ${table.padEnd(12)} ${n}`)
    .join('\n')
  process.stdout.write(`Seeded ${target}:\n${rows}\n`)
}
