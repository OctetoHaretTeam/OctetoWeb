# Bugs found and fixed

Real bugs, with their causes. Kept because most were **invisible until
something specific was checked**, and the checks are reusable.

## Privacy

**Withheld photos and surnames were in view-source.** Consent was applied in
the component, but loader data is serialised into the HTML for hydration.
Fixed at the server boundary — [[Why consent is applied on the server]].

## Data integrity

**Re-running the seed duplicated the team's awards.** `award` was the one
table without a natural unique key, so `onConflictDoNothing` had nothing to
match. Added `award_unique_per_event_idx`. A duplicated Connect Award on this
team's site is exactly what a judge would notice.

**The local database corrupted itself.** Full write-up:
[[The database corruption]].

**A database dump nearly reached git** with member names and consent flags in
it. The `.gitignore` rule un-ignored rather than ignored.

## Saving

**Nothing with an image could be saved.** `imageSchema` validated `url` with
`z.url()`, which requires an *absolute* URL — but the local store returns
`/uploads/…`. Every entity failed. It surfaced as "URL invalid" on sponsors
because a logo is mandatory there, which made it look like a sponsors problem.

**And a second bug hid behind it.** Alt text is required and starts empty after
upload, so the save would still have been refused **with nothing on screen
saying why**: forms indexed validation errors by the first path segment only,
so a nested failure like `image.alt.ro` was unreachable by the field rendering
it.

## Rendering

**Uploaded images 404'd despite uploading fine.** A request ending in `.webp`
is claimed by Vite's static middleware before the router sees it — the 404 was
a bare `Cannot GET`, not the handler's. Proven by requesting the same route
*without* an extension, which did reach the handler. See
[[Images and uploads]].

**A missing image showed a broken icon instead of the placeholder.** `onError`
cannot catch it: the page is server-rendered, so the image finishes failing
**before React hydrates** and the handler attaches too late. Fixed by
re-checking `naturalWidth` on mount.

**The hero watermark fought the slide image.** It was drawn behind a real
slide; it now steps aside when one exists.

## Design geometry

**Every `PaperCutout` had a discontinuity.** The slow-drift noise layer was
sampled at `t * 0.5`, completing only half a loop of a ring that wraps at 1 —
so each closed outline had a small step where it joined back up. Found by
writing a wrap test during an unrelated refactor.

## Bundle

**`drizzle` shipped to every public page.** The admin form imported its Zod
schema from the server module — [[Why the form schemas are hand-written]].

**Server auth code reached the client build**, twice, through a barrel
re-export and a middleware builder chain — [[Auth and admin]].

## Branch theming

**The non-tech primary button stayed green.** `--primary: var(--branch-accent)`
was declared once on `:root`; a custom property is substituted **where it is
declared**, so it resolved to signal there and inherited that value.
Descendants never re-evaluate. The branch-dependent tokens are now declared in
each branch block.

**Label tracking never changed between branches** — `text-2xs` also sets
`letter-spacing` and whichever Tailwind emitted later won. The label utility
now owns its own size.

---

## Checks that keep paying off

- `curl` the raw HTTP — status codes, headers, and what is actually in the
  SSR HTML. Most of the above were invisible in a browser.
- Grep the built client bundle for `drizzle`, secrets, and server symbols.
- Compute contrast numerically rather than eyeballing it.
- Screenshots from the team. The broken-image and watermark bugs were only
  ever going to surface that way.
