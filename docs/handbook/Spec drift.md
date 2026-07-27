# Spec drift

Places where the built site **deliberately disagrees with `CLAUDE.md`**. Each
was a team decision, not an oversight. Listed here so nobody rebuilds the old
design from the spec.

> [!important] `CLAUDE.md` currently describes a site that no longer exists in
> two respects. It should probably be updated to match, or these decisions
> re-litigated.

## §7.3 — different structures per branch

**The spec says:** tech gets a hairline grid, exploded diagrams and spec
tables; non-tech gets collage, overlapping cutouts, photo-led.

**The site does:** one structure for both. Only ground, text and accent
change.

**Why:** the team saw both built, preferred the collage, and asked for the
palette to be the only difference — the differing layouts made it hard to tell
which section was which.

The torn seam between the two halves of `/performance` **stays**, since that
is a colour boundary rather than a structural difference.

## §7.4 — where `PaperCutout` may appear

**The spec says:** team cards, member profiles, and non-tech entry covers.
"Nowhere else — if it appears on every surface it stops being a signature."

**The site does:** the above, plus **technical** entry covers, as a
consequence of the §7.3 decision above.

The tear *maths* is also shared with the `/performance` seam and with
`TornSection`, but that was done deliberately as a shared generator rather
than reusing the component — the halo itself stays exclusive to people and to
entry covers.

## §6 — the scan write should not block

**The spec says:** "The scan-log write must not block the redirect."

**The site does:** awaits it.

**Why:** an un-awaited write is a loose database call that can overlap
anything in flight, which is implicated in [[The database corruption]]. A
single indexed insert is a few milliseconds. Full reasoning in [[QR system]].

This one is arguably worth changing back once the database is Neon rather than
local PGlite — the failure mode was specific to a WASM database on one
directory.

## §12 — the performance budget

Not a decision, an **unresolved miss**. See [[Open questions]].

## Related

[[Design system]] · [[QR system]] · [[Open questions]]
