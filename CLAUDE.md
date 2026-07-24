# CLAUDE.md — OctetoHaret (FTC #25474)

Instructions for AI assistants working in this repository.
Read fully before generating code. If a request conflicts with this file, follow
this file and say so out loud.

---

## 1. The team

**OctetoHaret**, FIRST Tech Challenge team **#25474**, IPLT „Spiru Haret",
Chișinău, Republic of Moldova. Founded January 2024 by eight students; now ~13
members plus volunteers, mentored by the school's computer science teacher.
Organised into a **technical** group and a **non-technical** group — this split
is structural to the whole site, not just an org chart.

**Awards:** Connect Award, FTC Moldova Nationals 2025. Connect Award, FTC Moldova
Nationals 2026 (DECODE). Two seasons, same award — outreach and connection is the
team's public identity.

**Socials:** Instagram `@octetoharet.ftc`, TikTok `@octetoharet`.
Sister FLL team: `@octetoharet.fll` — link to it from the About page.

**Name:** *Octeto* = octet = 8 bits = one byte = the eight founders. The mascot is
an octopus: eight arms, eight bits. This is the identity. Use it with restraint.

### Audiences, in priority order
1. **Judges** scanning a QR mid-competition on bad venue wifi. Need speed, awards,
   performance evidence, portfolio, in English.
2. **Sponsors** — Moldovan companies and diaspora. Need credibility, reach, contact.
3. **Peer teams and students.**
4. **Local press and parents.**

---

## 2. Hard constraints

- **Primary traffic is QR scans from printed shirts and banners at venues.** Assume
  3G on a mid-range Android. Design at 390px first.
- **Members are 14–18 years old.** See §8.
- **Bilingual RO / EN.** Romanian is default; English is what judges read. Building
  monolingual and retrofitting is the single most expensive mistake available here.
- **FIRST trademarks** ("FIRST", "FIRST Tech Challenge", season logos) belong to
  FIRST and follow their branding guidelines. Reference them in text; do not build
  the site's identity from them; never imply endorsement.

---

## 3. Stack (strict)

| Layer | Choice |
|---|---|
| Runtime / package manager | **Bun** — `bun install`, `bun add`, `bun run`. Never npm/yarn/pnpm. Commit `bun.lock`. |
| Framework | **React + Vite + TypeScript**, `strict: true` |
| Routing / full-stack | **TanStack Start** — file-based routing conventions only |
| Styling | **Tailwind CSS v4** — CSS-first `@theme`, no v3 `tailwind.config.js` |
| Components | **shadcn/ui** (Tailwind v4 / React 19 variant) |
| Icons | **lucide-react** |
| Database | **Neon** (serverless Postgres) |
| ORM | **Drizzle** + `drizzle-kit`, migrations committed |
| File storage | **Vercel Blob** — Postgres stores no files |
| Validation | **Zod** — every form, every server function, every route param |
| Deploy | **Vercel** |

**Never** use `react-router-dom`, Next.js App Router patterns, `next/image`,
`next/link`, or any Next-specific API.

TanStack Start's API has shifted across versions and training data is often stale.
If you are unsure of current syntax, **say so and check the docs** rather than
inventing a plausible-looking API.

---

## 4. Site structure

```
/                          Home
/news                      News index
/news/$slug                Article
/performance               Overview — the two branches, side by side
/performance/tech          Technical achievements
/performance/non-tech      Non-technical achievements
/performance/$branch/$slug Single entry
/seasons                   Season index
/seasons/$slug             Season detail — description, gallery, awards, portfolio
/team                      Roster
/team/$slug                Member profile  ←  QR destination
/sponsors                  Sponsor wall
/about                     Origin story, photos, contacts
/q/$code                   QR resolver (redirect only, see §6)
/admin/*                   Protected admin
```

All public routes above are locale-prefixed — `/ro/team/$slug`, `/en/team/$slug`.
`/q/` and `/admin/` are not. See §11.

### Home
Everything a sponsor or a stranger wants in one scroll:
1. Rotating hero images (admin-managed slides), team name, one-line pitch.
2. Award strip — pulled from the `award` table, `isFeatured` first.
3. Stats row — seasons, awards, members, outreach events, people reached, sponsors.
   Computed from the database, **cached**, never queried per request.
4. Latest 3 news posts.
5. Short "who we are" block + sponsor logo row + contact CTA.

### Performance
The most distinctive page. `/performance` shows both branches as two visually
distinct halves (see §7.3), each linking to its own index.
- **Tech** — innovation, invention, design, CAD, code, mechanical, testing.
- **Non-tech** — meets and events, sponsorship, PR and media, outreach,
  collaborations, accessibility.

Each entry is a card → detail page with images and body text. Entries carry
optional metrics (people reached, funds raised, schools visited) which feed the
home stats row.

### Seasons
Admin adds a season with a description, image gallery, linked awards, and an
uploaded portfolio PDF. Season detail = the archive view judges look for.

### Team
The most important page. Cards use the `PaperCutout` signature component (§7.4).
Each member: one photo, name, role, description, optional Instagram link.
**Every member page is a QR destination — it must load fast and standalone.**

---

## 5. Database schema (Drizzle)

Every table: `id` (uuid), `createdAt`, `updatedAt`.
Bilingual text uses `…Ro` / `…En` column pairs. **`En` may be null → fall back to
`Ro` and render a small "available in Romanian" note.** Never render an empty block.

Shared image shape (one Zod schema, reused everywhere):
```ts
{ url: string; alt: { ro: string; en?: string }; width: number; height: number; blurhash?: string }
```

### `season`
`slug` (e.g. `2025-26-decode`), `name`, `gameName`, `startDate`, `endDate`,
`descriptionRo`, `descriptionEn`, `coverImage`, `gallery` (jsonb[]),
`portfolioUrl` (Blob PDF, nullable), `isCurrent`, `displayOrder`

### `award`
`seasonId` (fk), `nameRo`, `nameEn`, `eventName`, `eventDate`, `placement`
(nullable), `notesRo`, `notesEn`, `isFeatured`

### `teamMember`
`slug` (unique, stable — printed on shirts, treat as permanent), `name`,
`roleRo`, `roleEn`, `branch` (enum `tech` | `non_tech` | `mentor` | `volunteer`),
`descriptionRo`, `descriptionEn`, `image`, `instagramUrl` (nullable),
`octetIndex` (int 0–255), `isActive`, `displayOrder`,
`photoConsent` (bool, default **false**), `fullNamePublic` (bool, default **false**)

### `performanceEntry`
`slug`, `branch` (enum `tech` | `non_tech`), `category` (enum — tech:
`innovation`, `design`, `cad`, `code`, `mechanical`, `testing`; non-tech:
`outreach`, `sponsorship`, `pr_media`, `events`, `collaboration`,
`accessibility`), `titleRo`, `titleEn`, `summaryRo`, `summaryEn`, `bodyRo`,
`bodyEn` (markdown), `coverImage`, `gallery` (jsonb[]), `date`, `seasonId`
(nullable), `metrics` (jsonb, nullable — `{ peopleReached?, schoolsVisited?,
fundsRaisedMdl? }`), `isFeatured`, `displayOrder`

### `newsPost`
`slug`, `titleRo`, `titleEn`, `excerptRo`, `excerptEn`, `bodyRo`, `bodyEn`
(markdown), `coverImage`, `gallery` (jsonb[]), `publishedAt` (**null = draft**),
`authorMemberId` (nullable fk)

### `sponsor`
`name`, `logo`, `logoDark` (nullable), `descriptionRo`, `descriptionEn`,
`websiteUrl`, `tier` (enum, nullable — `platinum` | `gold` | `silver` | `partner`
| `in_kind`), `activeSeasons` (text[]), `displayOrder`

### `homeSlide`
`image`, `captionRo`, `captionEn`, `linkPath` (nullable), `isActive`, `displayOrder`

### `teamInfo` (singleton, id = 1)
`originStoryRo`, `originStoryEn`, `gallery` (jsonb[]), `foundedDate`, `schoolName`,
`city`, `country`, `contactEmail`, `phone` (nullable), `socialLinks` (jsonb),
`mapEmbedLat`, `mapEmbedLng`

### `qrCode`
`code` (unique, indexed), `label`, `targetPath`, `isActive`, `printedOn`

### `qrScan`
`qrCodeId` (fk), `scannedAt`, `country` (2-letter, nullable)

**No `users` table.** See §9.

---

## 6. QR system

Canonical route `/q/$code`. Every printed surface gets its own code so the team
learns which physical asset drives traffic — real, quotable Connect evidence.

```
m-<memberSlug>   member t-shirt
pit              pit board / banner
robot            robot placard
sponsor          sponsor packet and letters
portfolio        portfolio cover
outreach         workshop handouts
```

**Behaviour**
1. Look up `$code`. 2. Log the scan. 3. **Redirect 307 (Temporary)** to the
   locale-prefixed target.

**Resolve the locale on the way through.** `targetPath` is stored unprefixed
(`/team/andrei`); the resolver prefixes it using the `locale` cookie, then
`Accept-Language`, then `ro`. A judge at an international event scanning a shirt is
usually an English speaker and should land on English without touching the toggle —
this is the single highest-value place the language system pays off.

> Use **307, not 301**. A 301 is cached by browsers effectively forever — if a
> member graduates or a route changes, already-printed shirts break permanently
> with no way to fix them. 307 keeps the redirect under the team's control, which
> is the actual goal of the whole system.

4. Unknown code → a designed `/q/unknown` page with links home and to the roster.
   Never a raw 404.
5. `/q/$code` is the hottest route in the app. Redirect only: no rendering, no
   client JS, no data loading beyond the code lookup. The scan-log write must not
   block the redirect.

**Scan logging stores only** `codeId`, `scannedAt`, and a coarse country from
request headers. **No IPs, no user agents, no precise location, no device IDs, no
third-party analytics.** Surface aggregates (total scans, distinct countries) on
the home stats row and the admin dashboard.

---

## 7. Visual identity

### 7.1 The core idea
The brand has two layers. **Build on the paper layer; use the digital layer as
signal.**

- **Analog / paper layer** — sage kraft backdrop, torn cream cutouts, gold. This
  is the distinctive half and it is already the team's own. It carries the
  non-technical side, the team page, and About.
- **Digital layer** — ink black, signal green, mono type, hairline grids. Carries
  the technical side and all interactive states.

Near-black plus a single bright green accent is the most predictable direction a
robotics site can take. The paper layer is what makes this site *theirs*. Weight
accordingly.

### 7.2 Palette
Live in `src/styles/theme.css` as CSS custom properties. **Never hardcode a hex in
a component.**

```css
@theme {
  --color-ink:     #0A0C09;  /* base background, faintly green-tinted black */
  --color-carbon:  #141811;  /* elevated surface */
  --color-slate:   #232A20;  /* borders, dividers */
  --color-sage:    #7C8A6B;  /* kraft backdrop — non-tech canvas */
  --color-paper:   #E9E4D6;  /* cutout edges, cards, body text on dark */
  --color-signal:  #63F06A;  /* interactive ONLY */
  --color-gold:    #EFB428;  /* awards, sponsors, emphasis */
  --color-violet:  #8B5CF6;  /* logo gradient only */
}
```

> **These hexes are approximations sampled from Instagram screenshots.** Before
> launch, pull exact values from the logo SVG / Canva file and update this block.
> Everything else derives from here, so it is a one-line fix.

**Rules**
1. `--signal` is **interactive only**: links, primary buttons, focus rings, active
   nav, live indicators, tech-branch accents. Never decoration, never body text.
2. `--gold` is **achievement only**: award badges, sponsor tiers, key metrics.
   The two accents never compete for the same job.
3. `--sage` and `--paper` are **surfaces**, not accents. They carry the non-tech
   and team pages.
4. `--violet` appears in the logo. Do not build UI on it.
5. Accent colours together cover **under 10% of any viewport**.
6. Desaturate as area grows — badge: full chroma; button: ~85%; large panel: ~35%.
7. **No neon glow, no coloured box-shadow bloom, no gradient meshes, no
   glassmorphism, no matrix rain, no terminal-typing hero.** Flat surfaces, real
   hierarchy, one signature.

### 7.3 The branch split
`/performance/tech` and `/performance/non-tech` must feel visibly different while
staying obviously one site.

| | Tech | Non-tech |
|---|---|---|
| Ground | `--ink` | `--sage` with paper texture |
| Text | `--paper` | `--ink` |
| Accent | `--signal` | `--gold` |
| Type | mono for labels and specs | humanist sans throughout |
| Structure | hairline grid, exploded diagrams, spec tables | collage, overlapping cutouts, photo-led |

### 7.4 Signature: `PaperCutout`
The torn-paper polygon halo already used around every member on Instagram. One
component, one SVG mask, **seeded from the member slug** so each edge differs
slightly and it never looks like a stamped filter.

Used on team cards, member profiles, and non-tech entry covers. **Nowhere else** —
if it appears on every surface it stops being a signature.

### 7.5 The octet motif
Section dividers, loading states, and list markers built from an 8-cell grid.
Each member's `octetIndex` renders as 8 filled/empty squares — on their card, on
their profile, and printed beside their QR on merch, so shirt and site share one
grammar. Optional bit-flip on hover, gated on `prefers-reduced-motion`.

Restraint: this is seasoning. Not every element needs eight of something.

### 7.6 Typography
Three families maximum, self-hosted, `font-display: swap`, no Google Fonts network
request.

- **Display** — a heavy, slightly expanded grotesque echoing the chunky outlined
  OCTETO wordmark. Archivo (with width axis) or Anybody. Used with restraint.
- **Body** — a warm humanist sans. Instrument Sans or Public Sans.
- **Utility/mono** — specs, metrics, the octet motif, tech labels. Martian Mono or
  JetBrains Mono.

**Do not use Inter.** It is the default tell.

### 7.7 Accessibility — mandatory
The team has publicly done accessibility outreach, including a visit to a school
for visually impaired children. An inaccessible site is a story a judge can find.

- WCAG 2.1 **AA minimum** on all text and interactive elements. `--signal` on
  `--ink` clears AA; `--signal` on `--sage` does **not** — check every pairing.
- Visible high-contrast focus rings. Never `outline: none` without a replacement.
- `prefers-reduced-motion` honoured on every animation, no exceptions.
- Semantic HTML, real headings and landmarks, real buttons.
- Alt text on every image, both languages.
- Full keyboard navigation, including admin.

---

## 8. Minors and privacy

Not a formality — members are 14–18.

- `photoConsent` defaults **false** → placeholder avatar, never the photograph.
- `fullNamePublic` defaults **false** → render first name + last initial.
- No surnames of minors in page titles, meta descriptions, or `og:` tags unless
  `fullNamePublic` is true.
- **Strip EXIF, including GPS, from every uploaded image.**
- No third-party analytics, tracking pixels, cookie-setting social embeds, or ad
  networks. The §6 scan log is the only telemetry and holds no personal data.
- Cookies limited to the session cookie and the locale cookie — both strictly
  necessary, so no consent banner is required. Keep it that way.
- A short plain-language privacy page in both languages.

---

## 9. Auth

- **Zero user database.** No users table, no registration, no password reset.
- Sign in with Google. On callback, compare lowercased `profile.email` against the
  comma-separated env var `ALLOWED_ADMIN_EMAILS`.
- Not on the list → destroy the session, return **403**, create no record, leak
  nothing about whether the address exists.
- **`ALLOWED_ADMIN_EMAILS` is server-side only.** Never a `VITE_` prefix, never in
  the client bundle.
- Session cookie: `httpOnly`, `secure`, `sameSite: lax`, signed.
- **8-hour sliding window**, refreshed on activity, plus **localStorage draft
  autosave in every admin editor**. Expiring on browser close destroys half-written
  posts; if a shorter lifetime is wanted, make it an env var.
- Guard `/admin/*` in `beforeLoad` **and** re-verify inside every mutating server
  function. Never trust the client. CSRF protection on all mutations.

---

## 10. Admin panel

Sidebar: Dashboard · Home slides · News · Performance · Seasons · Awards · Team ·
Sponsors · Info · QR codes.

- Same identity as the public site, denser. **Admin UI is Romanian-only** — it is
  for the team, not the public.
- shadcn/ui data tables with search, sort, drag-to-reorder for `displayOrder`.
- Bilingual fields render as side-by-side RO / EN inputs in one form, never as
  separate records. EN clearly marked optional.
- Markdown editor with live preview for all `body` fields.
- Image upload direct to Vercel Blob: client preview, size cap, MIME allowlist,
  EXIF stripped, dimensions captured on upload.
- Zod validation on client and server; **the server schema is the source of truth**.
- Drafts: `publishedAt === null`. Preview at `/preview/$type/$slug`, admin-gated.
- Every destructive action behind a confirm dialog.
- **Dashboard leads with QR scan stats** — total, by code, by country, last 30 days.
  This is what the team will actually open the panel for.

---

## 11. Language system (RO / EN)

Romanian is the default and the team's own language. English is what international
judges and sponsors read. Both are first-class.

### Routing
- Locale prefix on every public URL: `/ro/…`, `/en/…`. No unprefixed content routes.
- Bare `/` resolves the locale from the `locale` cookie, falling back to
  `Accept-Language`, falling back to `ro`, then redirects (**302**, not 301 —
  language preference must stay changeable).
- The choice is persisted to the `locale` cookie the moment the user switches.

### The switcher
- Lives in the site header, **always visible**, on every viewport including mobile.
  It is not hidden in a menu.
- **Two-state toggle: `RO` / `EN`.** One tap, no dropdown.
- **Text labels, never flags.** Romanian is spoken in both Moldova and Romania, and
  English has no single country. Flags would be both wrong and politically clumsy.
- **Rendered as real `<a>` links to the equivalent page**, not a JS handler.
  Switching on `/ro/team/andrei` goes to `/en/team/andrei`, never to the home page.
  Losing the user's place is the classic failure here.
- **Must work with JavaScript disabled or still loading.** On congested venue wifi
  the toggle is often the first thing a judge touches — it cannot depend on hydration.
- `aria-label` on each option; the active locale marked `aria-current="true"`.

### Content
- Bilingual at the **database** level via `…Ro` / `…En` column pairs.
  **No machine translation at render time, ever.**
- `En` may be null. Fall back to `Ro` and render a small, quiet note — *"Acest text
  este disponibil doar în română" / "This text is only available in Romanian"*.
  Never render an empty block, and never hide the switcher on such a page.
- UI strings (buttons, labels, empty states, errors) live in **typed dictionaries**
  under `src/i18n/`, keyed identically across locales so a missing key is a
  TypeScript error rather than a blank button.
- Dates, numbers, and currency formatted per locale via `Intl`. MDL for RO.

### SEO and metadata
- `hreflang` alternates on every page, plus `x-default`.
- Correct `lang` attribute on `<html>`.
- `og:locale` and `og:locale:alternate` set per page.
- Localised slugs are **not** used — one slug serves both locales. Slugs are printed
  on merchandise and must never depend on language.

### Admin
Admin UI is **Romanian-only**. It is for the team, not the public. The bilingual
part of admin is the content editors, which show side-by-side RO / EN inputs in one
form with EN clearly marked optional.

---

## 12. Performance budget

Assume a judge on congested venue wifi.

- **LCP < 2.0s on simulated 3G.** FCP < 1.2s. **CLS ≈ 0.**
- Every image has explicit dimensions or a fixed aspect-ratio box. Team cards
  reserve exact space before the photo loads.
- Public-route JS under ~100KB gzipped. Admin bundle code-split, never shipped to
  public routes.
- Images: WebP/AVIF, responsive `srcset`, `loading="lazy"` below the fold,
  `fetchpriority="high"` on the LCP image, blurhash placeholder.
- Prerender or aggressively cache all public routes. Content changes rarely; a
  judge should never wait on a database round-trip.
- Home stats are a cached aggregate, recomputed on write or on a schedule.

---

## 13. Code standards

- Functional TypeScript, `strict: true`. **No `any`** — unknown shapes get
  `unknown` plus a Zod parse.
- Zod schemas are the single source of truth; derive types with `z.infer`.
- Components small and single-purpose; extract at ~150 lines.
- Named exports, absolute imports via `@/`.
- No inline `style={{}}` except genuinely dynamic values.
- Error boundaries on every route — designed pages in the user's locale, never a
  stack trace.
- No `console.log` in committed code. Conventional commits.

### Copy
Active voice, sentence case, plain verbs. A button says what happens: "Publică",
not "Trimite" — and the resulting toast uses the same word. Empty states are an
invitation to act, not an apology. Errors say what broke and how to fix it.

### Seed data
Use **real, verified team content** or explicit `[PLACEHOLDER — confirm with team]`
markers. **Never invent member names, robot specs, sponsor names, outreach
numbers, or award results.** A fabricated statistic on a Connect team's site is a
real problem, not a cosmetic one.

---

## 14. Definition of done

- [ ] Works at 390px
- [ ] Works in RO and EN, with EN falling back gracefully
- [ ] Keyboard navigable, visible focus
- [ ] Contrast verified at AA for the actual colour pairing used
- [ ] Zero layout shift
- [ ] Loading, error, and empty states all designed
- [ ] `prefers-reduced-motion` honoured
- [ ] Server-side validation present, not just client-side
- [ ] No `any`, no `console.log`

---

## 15. Open questions — ask, don't guess

1. **Exact brand hexes** from the logo SVG (§7.2 values are screenshot estimates).
2. **Final domain** — it gets printed on shirts, so it must be locked before any
   merch run.
3. **Roster** — names, roles, branch, and photo/name consent per member.
4. **Sponsor list** and whether tiers are used at all.
5. **Season archive** — descriptions, galleries, awards, portfolio PDFs per season.
6. **Logo files** — SVG, plus a version that works on the sage background.
