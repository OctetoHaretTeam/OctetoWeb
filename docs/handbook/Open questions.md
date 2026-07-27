# Open questions

Things that need a decision, an answer from the team, or a measurement.

## Needs a decision

### The performance budget is missed

§12 asks for public-route JS under **~100 KB gzipped**. Measured from the
production build, per route:

| Route | gzip | brotli |
|---|---|---|
| `/ro` | ~138 KB | ~118 KB |
| `/ro/team` | ~140 KB | ~119 KB |

Roughly **97 KB of that is the React + TanStack Router baseline** — it was
true before a single page existed. The rest is the RPC client and shared UI.

Two honest options: revise the budget, or give `/team/$slug` and `/q/` a
minimal-hydration treatment. `/team/$slug` is the QR destination, so it is the
one that matters.

> [!note] Flagged since Phase 0. Still unresolved.

### Font swap is an unmeasured CLS risk

Three families load with `font-display: swap` and **no fallback metric
overrides**, so text reflows when they arrive. §12 asks for CLS ≈ 0.

The fix is a fallback `@font-face` with `size-adjust` / `ascent-override`
tuned per family. That needs measured metrics, so it was not guessed at. Worth
doing now that real pages exist.

### Whether to update `CLAUDE.md`

See [[Spec drift]] — the file disagrees with the site in three places.

## Needs an answer from the team

From §15, still open:

1. **Exact brand hexes** from the logo SVG. Everything in
   [[Design system]] is sampled by eye. `/styleguide` recomputes contrast
   live, so swapping them in immediately shows what breaks.
2. **Final domain** — it gets printed on shirts, so lock it before any merch
   run.
3. **Roster** — names, roles, branch, and photo/name consent per member.
4. **Sponsor list**, and whether tiers are used at all.
5. **Season archive** — descriptions, galleries, portfolio PDFs.
6. **Logo files** — SVG, plus a version that works on sage. The current
   `public/logo.webp` is a raster with a baked-in dark background; the hero
   watermark only works because `mix-blend-mode: screen` drops that black.
7. **Founding date** — January 2024 is known, the exact day is not.

## Needs infrastructure

- **Neon database.** Everything runs on local PGlite today —
  [[Running locally]].
- **`BLOB_READ_WRITE_TOKEN`.** Uploads currently land in `public/uploads/`.
- **Production env vars** in Vercel: `SESSION_SECRET`,
  `ALLOWED_ADMIN_EMAILS`, the Google OAuth pair, `VITE_SITE_URL`.
- **Google OAuth redirect URI** for the production domain, alongside the
  localhost one.

## Related

[[Spec drift]] · [[Environment variables]] · [[Design system]]
