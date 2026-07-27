# Database

Ten tables, defined in `src/db/schema.ts`. Every one has `id` (uuid),
`createdAt`, `updatedAt`. Migrations live in `drizzle/` and are committed.

`season` · `award` · `teamMember` · `performanceEntry` · `newsPost` ·
`sponsor` · `homeSlide` · `teamInfo` (singleton, id 1) · `qrCode` · `qrScan`

**There is no `users` table**, by design — see [[Auth and admin]].

## Bilingual columns

Text comes in `…Ro` / `…En` pairs. **`En` may be null**; the site falls back
to Romanian and renders a quiet note. It never renders an empty block, and it
never machine-translates. See [[Language system]].

## Constraints worth knowing

- **Branch / category pairing** on `performanceEntry` is a check constraint,
  so a tech entry cannot carry a non-tech category. The admin form narrows the
  category list too, so nobody using the form ever reaches the constraint.
- **One current season** — a partial unique index. Setting a season current
  therefore clears the others *in the same transaction*; doing it the other
  way round trips the constraint.
- **Awards cannot be deleted by cascade.** The `season → award` foreign key is
  `restrict`, because the team's two Connect Awards are its public identity.
  Deleting a season with awards attached is refused with an explanation.
- **`award_unique_per_event_idx`** on `(seasonId, nameRo, eventName)` — added
  after a real bug, see [[Bugs found and fixed]].

## Seed discipline

`src/db/seed.ts` uses `[PLACEHOLDER — confirm with team]` markers and
**invents nothing**: no member names, no sponsors, no metrics, no award
results. Tests assert this — that consent flags are off, posts are drafts, QR
paths are unprefixed, and no statistics were fabricated.

> [!note] The only real data in the seed
> The two Connect Awards and their confirmed dates: FTC Moldova Nationals
> **5 April 2025** (INTO THE DEEP) and **21 February 2026** (DECODE).
> `foundedDate` is January 2024 but the exact day is still unknown.

## Dates are strings

Drizzle returns `date` columns as `YYYY-MM-DD`. `formatDate` parses a bare
date string as **UTC** — parsing as local time would render 5 April as
4 April for anyone west of UTC. There is a test pinning this.

## Two drivers, one type

`db` is typed as the Neon driver even when PGlite is running locally. The
union of two driver types made TypeScript reject valid `.returning()` calls;
pinning it to the production driver keeps every call site typed against what
actually ships. See [[Running locally]].

## Related

[[Running locally]] · [[Auth and admin]] · [[Why consent is applied on the server]]
