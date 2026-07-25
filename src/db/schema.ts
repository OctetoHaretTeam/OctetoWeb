import { relations, sql } from 'drizzle-orm'
import {
  boolean,
  char,
  check,
  date,
  doublePrecision,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core'

import type {
  Gallery,
  ImageAsset,
  PerformanceMetrics,
  SocialLinks,
} from '@/lib/schemas'

/**
 * OctetoHaret database schema — CLAUDE.md §5.
 *
 * There is deliberately no `users` table: admin access is an env-var email
 * allowlist checked against a Google profile, and no user record is ever
 * created (§9).
 *
 * Column names are derived automatically from the camelCase keys by the
 * `casing: 'snake_case'` setting, which is configured identically in
 * `drizzle.config.ts` and in the client in `src/db/index.ts`. Do not change it
 * in one place only — every column name in the database depends on it.
 */

// ─── Shared column groups ────────────────────────────────────────────────────

const id = {
  id: uuid().primaryKey().defaultRandom(),
}

const timestamps = {
  createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp({ withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
}

// ─── Enums ───────────────────────────────────────────────────────────────────

/**
 * Team members span four groups. This is intentionally a different enum from
 * `performanceBranch` — a performance entry can only be tech or non-tech,
 * while a person can also be a mentor or a volunteer (§5).
 */
export const memberBranchEnum = pgEnum('member_branch', [
  'tech',
  'non_tech',
  'mentor',
  'volunteer',
])

export const performanceBranchEnum = pgEnum('performance_branch', [
  'tech',
  'non_tech',
])

/**
 * All twelve categories live in one Postgres enum, but only six are legal for
 * each branch. That pairing is enforced by a check constraint on
 * `performanceEntry` and again in Zod, so an entry cannot be filed as
 * `tech` / `outreach`.
 */
export const performanceCategoryEnum = pgEnum('performance_category', [
  // tech
  'innovation',
  'design',
  'cad',
  'code',
  'mechanical',
  'testing',
  // non-tech
  'outreach',
  'sponsorship',
  'pr_media',
  'events',
  'collaboration',
  'accessibility',
])

export const TECH_CATEGORIES = [
  'innovation',
  'design',
  'cad',
  'code',
  'mechanical',
  'testing',
] as const

export const NON_TECH_CATEGORIES = [
  'outreach',
  'sponsorship',
  'pr_media',
  'events',
  'collaboration',
  'accessibility',
] as const

export const sponsorTierEnum = pgEnum('sponsor_tier', [
  'platinum',
  'gold',
  'silver',
  'partner',
  'in_kind',
])

// ─── season ──────────────────────────────────────────────────────────────────

export const season = pgTable(
  'season',
  {
    ...id,
    /** e.g. `2025-26-decode`. Printed in URLs — treat as stable. */
    slug: text().notNull().unique(),
    name: text().notNull(),
    gameName: text().notNull(),
    startDate: date().notNull(),
    /** Null while the season is still running. */
    endDate: date(),
    descriptionRo: text().notNull(),
    descriptionEn: text(),
    coverImage: jsonb().$type<ImageAsset>(),
    gallery: jsonb().$type<Gallery>().notNull().default([]),
    /** Vercel Blob URL of the season portfolio PDF. */
    portfolioUrl: text(),
    isCurrent: boolean().notNull().default(false),
    displayOrder: integer().notNull().default(0),
    ...timestamps,
  },
  (t) => [
    index('season_display_order_idx').on(t.displayOrder),
    // At most one season may be current at a time.
    uniqueIndex('season_single_current_idx')
      .on(t.isCurrent)
      .where(sql`${t.isCurrent}`),
  ],
)

// ─── award ───────────────────────────────────────────────────────────────────

export const award = pgTable(
  'award',
  {
    ...id,
    /**
     * `restrict`, not `cascade`. The team's awards are its public identity
     * (§1) — deleting a season must not silently take its award history with
     * it. Reassign or delete the awards first.
     */
    seasonId: uuid()
      .notNull()
      .references(() => season.id, { onDelete: 'restrict' }),
    nameRo: text().notNull(),
    nameEn: text(),
    eventName: text().notNull(),
    eventDate: date().notNull(),
    placement: text(),
    notesRo: text(),
    notesEn: text(),
    isFeatured: boolean().notNull().default(false),
    ...timestamps,
  },
  (t) => [
    index('award_season_idx').on(t.seasonId),
    index('award_featured_idx').on(t.isFeatured, t.eventDate),
    /**
     * The same award cannot be recorded twice for the same event in the same
     * season. Winning the same award at two different events is still fine,
     * because `eventName` differs.
     *
     * This is the only table without a natural unique key, which meant a
     * re-run of the seed silently duplicated the team's awards — and a
     * duplicated Connect Award on this particular team's site is exactly the
     * kind of error a judge would notice.
     */
    uniqueIndex('award_unique_per_event_idx').on(
      t.seasonId,
      t.nameRo,
      t.eventName,
    ),
  ],
)

// ─── teamMember ──────────────────────────────────────────────────────────────

export const teamMember = pgTable(
  'team_member',
  {
    ...id,
    /**
     * Printed on shirts and embedded in QR codes — permanent. Changing a slug
     * breaks physical merchandise that is already in the world (§5, §6).
     */
    slug: text().notNull().unique(),
    /**
     * Full name as the team knows it. This is NOT necessarily what gets
     * rendered: when `fullNamePublic` is false, only first name + last initial
     * may be shown. Always go through `publicDisplayName()` in
     * `src/lib/privacy.ts` (§8).
     */
    name: text().notNull(),
    roleRo: text().notNull(),
    roleEn: text(),
    branch: memberBranchEnum().notNull(),
    descriptionRo: text(),
    descriptionEn: text(),
    /**
     * Never render this directly. When `photoConsent` is false the placeholder
     * avatar must be shown instead, even if a photo exists here (§8).
     */
    image: jsonb().$type<ImageAsset>(),
    instagramUrl: text(),
    /** 0–255 — rendered as 8 filled/empty cells by the octet motif (§7.5). */
    octetIndex: integer().notNull(),
    isActive: boolean().notNull().default(true),
    displayOrder: integer().notNull().default(0),
    /** Defaults false — members are 14–18 and consent is opt-in (§8). */
    photoConsent: boolean().notNull().default(false),
    fullNamePublic: boolean().notNull().default(false),
    ...timestamps,
  },
  (t) => [
    index('team_member_active_order_idx').on(t.isActive, t.displayOrder),
    index('team_member_branch_idx').on(t.branch),
    check(
      'team_member_octet_index_range',
      sql`${t.octetIndex} >= 0 and ${t.octetIndex} <= 255`,
    ),
  ],
)

// ─── performanceEntry ────────────────────────────────────────────────────────

export const performanceEntry = pgTable(
  'performance_entry',
  {
    ...id,
    slug: text().notNull().unique(),
    branch: performanceBranchEnum().notNull(),
    category: performanceCategoryEnum().notNull(),
    titleRo: text().notNull(),
    titleEn: text(),
    summaryRo: text().notNull(),
    summaryEn: text(),
    /** Markdown. */
    bodyRo: text().notNull(),
    bodyEn: text(),
    coverImage: jsonb().$type<ImageAsset>(),
    gallery: jsonb().$type<Gallery>().notNull().default([]),
    date: date().notNull(),
    seasonId: uuid().references(() => season.id, { onDelete: 'set null' }),
    /** Feeds the cached home stats row (§4). */
    metrics: jsonb().$type<PerformanceMetrics>(),
    isFeatured: boolean().notNull().default(false),
    displayOrder: integer().notNull().default(0),
    ...timestamps,
  },
  (t) => [
    index('performance_entry_branch_idx').on(t.branch, t.displayOrder),
    index('performance_entry_season_idx').on(t.seasonId),
    index('performance_entry_featured_idx').on(t.isFeatured, t.date),
    check(
      'performance_entry_branch_category',
      sql`(${t.branch} = 'tech' and ${t.category} in ('innovation', 'design', 'cad', 'code', 'mechanical', 'testing'))
       or (${t.branch} = 'non_tech' and ${t.category} in ('outreach', 'sponsorship', 'pr_media', 'events', 'collaboration', 'accessibility'))`,
    ),
  ],
)

// ─── newsPost ────────────────────────────────────────────────────────────────

export const newsPost = pgTable(
  'news_post',
  {
    ...id,
    slug: text().notNull().unique(),
    titleRo: text().notNull(),
    titleEn: text(),
    excerptRo: text().notNull(),
    excerptEn: text(),
    /** Markdown. */
    bodyRo: text().notNull(),
    bodyEn: text(),
    coverImage: jsonb().$type<ImageAsset>(),
    gallery: jsonb().$type<Gallery>().notNull().default([]),
    /** Null means draft — never expose these on a public route (§10). */
    publishedAt: timestamp({ withTimezone: true }),
    authorMemberId: uuid().references(() => teamMember.id, {
      onDelete: 'set null',
    }),
    ...timestamps,
  },
  (t) => [
    index('news_post_published_idx').on(t.publishedAt),
    index('news_post_author_idx').on(t.authorMemberId),
  ],
)

// ─── sponsor ─────────────────────────────────────────────────────────────────

export const sponsor = pgTable(
  'sponsor',
  {
    ...id,
    name: text().notNull(),
    logo: jsonb().$type<ImageAsset>().notNull(),
    /** Optional variant for dark grounds — the sponsor wall sits on `--ink`. */
    logoDark: jsonb().$type<ImageAsset>(),
    descriptionRo: text(),
    descriptionEn: text(),
    websiteUrl: text(),
    tier: sponsorTierEnum(),
    /**
     * Season slugs this sponsor supported. Denormalised text[] per §5 rather
     * than a join table, so it is NOT foreign-key enforced — renaming a season
     * slug will not update these. Validated against `season.slug` in the admin
     * form instead.
     */
    activeSeasons: text().array().notNull().default([]),
    displayOrder: integer().notNull().default(0),
    ...timestamps,
  },
  (t) => [index('sponsor_tier_order_idx').on(t.tier, t.displayOrder)],
)

// ─── homeSlide ───────────────────────────────────────────────────────────────

export const homeSlide = pgTable(
  'home_slide',
  {
    ...id,
    image: jsonb().$type<ImageAsset>().notNull(),
    captionRo: text(),
    captionEn: text(),
    /** Stored WITHOUT a locale prefix, e.g. `/team/andrei` — same rule as `qrCode.targetPath`. */
    linkPath: text(),
    isActive: boolean().notNull().default(true),
    displayOrder: integer().notNull().default(0),
    ...timestamps,
  },
  (t) => [
    index('home_slide_active_order_idx').on(t.isActive, t.displayOrder),
    check(
      'home_slide_link_path_unprefixed',
      sql`${t.linkPath} is null or (${t.linkPath} ~ '^/' and ${t.linkPath} !~ '^/(ro|en)(/|$)')`,
    ),
  ],
)

// ─── teamInfo — singleton ────────────────────────────────────────────────────

/**
 * Singleton, `id = 1` (§5). This is the one table that does not use a uuid
 * primary key: §5 pins the id to the literal 1, which a uuid cannot express.
 * The check constraint makes a second row impossible.
 */
export const teamInfo = pgTable(
  'team_info',
  {
    id: integer().primaryKey().default(1),
    originStoryRo: text().notNull(),
    originStoryEn: text(),
    gallery: jsonb().$type<Gallery>().notNull().default([]),
    foundedDate: date().notNull(),
    schoolName: text().notNull(),
    city: text().notNull(),
    /** ISO 3166-1 alpha-2, e.g. `MD`. */
    country: char({ length: 2 }).notNull(),
    contactEmail: text().notNull(),
    phone: text(),
    socialLinks: jsonb().$type<SocialLinks>().notNull().default({}),
    mapEmbedLat: doublePrecision(),
    mapEmbedLng: doublePrecision(),
    ...timestamps,
  },
  (t) => [
    check('team_info_singleton', sql`${t.id} = 1`),
    check('team_info_country_iso', sql`${t.country} ~ '^[A-Z]{2}$'`),
  ],
)

// ─── qrCode ──────────────────────────────────────────────────────────────────

export const qrCode = pgTable(
  'qr_code',
  {
    ...id,
    /** e.g. `m-andrei`, `pit`, `robot`, `sponsor`, `portfolio`, `outreach` (§6). */
    code: text().notNull().unique(),
    label: text().notNull(),
    /**
     * Stored WITHOUT a locale prefix, e.g. `/team/andrei`. The resolver adds
     * `/ro` or `/en` per request (§6) — storing a prefixed path here would pin
     * every scan of a printed shirt to one language permanently.
     */
    targetPath: text().notNull(),
    isActive: boolean().notNull().default(true),
    /**
     * Inventory tracking: when this physical surface was produced or deployed.
     * The print batch date for a shirt, the day a pit banner went up, the date
     * a stack of cards was made.
     *
     * It exists so the team can see whether old merchandise still drives
     * traffic months later, correlate a scan spike with a specific print run,
     * and retire codes when merch is reprinted with updated branding.
     *
     * Nullable, and usually empty — digital distribution has no print date and
     * it often simply is not recorded. When null, omit it from displays rather
     * than showing a placeholder.
     *
     * Admin label (§10): „Când a fost imprimat/distribuit codul acesta".
     */
    printedOn: date(),
    ...timestamps,
  },
  (t) => [
    check(
      'qr_code_target_path_unprefixed',
      sql`${t.targetPath} ~ '^/' and ${t.targetPath} !~ '^/(ro|en)(/|$)'`,
    ),
  ],
)

// ─── qrScan ──────────────────────────────────────────────────────────────────

/**
 * Append-only scan log. Stores ONLY the code, the timestamp and a coarse
 * country (§6). Never add an IP address, user agent, device identifier or
 * precise location to this table — that is a hard privacy line (§8), not a
 * preference.
 */
export const qrScan = pgTable(
  'qr_scan',
  {
    ...id,
    qrCodeId: uuid()
      .notNull()
      .references(() => qrCode.id, { onDelete: 'cascade' }),
    scannedAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
    /** ISO 3166-1 alpha-2 from request headers. Null when unknown. */
    country: char({ length: 2 }),
    ...timestamps,
  },
  (t) => [
    index('qr_scan_code_time_idx').on(t.qrCodeId, t.scannedAt),
    index('qr_scan_time_idx').on(t.scannedAt),
    index('qr_scan_country_idx').on(t.country),
    check(
      'qr_scan_country_iso',
      sql`${t.country} is null or ${t.country} ~ '^[A-Z]{2}$'`,
    ),
  ],
)

// ─── Relations ───────────────────────────────────────────────────────────────

export const seasonRelations = relations(season, ({ many }) => ({
  awards: many(award),
  performanceEntries: many(performanceEntry),
}))

export const awardRelations = relations(award, ({ one }) => ({
  season: one(season, { fields: [award.seasonId], references: [season.id] }),
}))

export const teamMemberRelations = relations(teamMember, ({ many }) => ({
  newsPosts: many(newsPost),
}))

export const performanceEntryRelations = relations(
  performanceEntry,
  ({ one }) => ({
    season: one(season, {
      fields: [performanceEntry.seasonId],
      references: [season.id],
    }),
  }),
)

export const newsPostRelations = relations(newsPost, ({ one }) => ({
  author: one(teamMember, {
    fields: [newsPost.authorMemberId],
    references: [teamMember.id],
  }),
}))

export const qrCodeRelations = relations(qrCode, ({ many }) => ({
  scans: many(qrScan),
}))

export const qrScanRelations = relations(qrScan, ({ one }) => ({
  qrCode: one(qrCode, { fields: [qrScan.qrCodeId], references: [qrCode.id] }),
}))
