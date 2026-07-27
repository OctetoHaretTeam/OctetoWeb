# Design system

`src/styles/theme.css` is the single source of colour and type truth. **Never
hardcode a hex in a component.**

## Palette

```
--color-ink     #0a0c09   base background
--color-carbon  #141811   elevated surface
--color-slate   #232a20   borders, dividers
--color-sage    #7c8a6b   kraft backdrop — non-tech canvas
--color-paper   #e9e4d6   cutouts, cards, body text on dark
--color-signal  #5cb94a   interactive ONLY
--color-gold    #efb428   achievement ONLY
--color-violet  #8b5cf6   logo gradient only
```

> [!warning] These are still estimates
> Sampled by eye — `--color-signal` from a swatch the team sent, the rest from
> Instagram screenshots. The exact values must come from the logo SVG. See
> [[Open questions]].

The `/styleguide` route **recomputes every contrast ratio from the live
palette**, and `contrast.test.ts` fails if a pairing stops clearing AA. So
swapping in the real hexes immediately shows what broke.

## The sage constraint

The load-bearing accessibility fact on this site:

> [!danger] No chromatic accent clears 4.5:1 against sage
> Sage is a mid-tone. Gold on sage measures **1.97:1**, signal **2.49:1** —
> and darkening does not rescue either; gold only reaches 3.15:1 by which
> point it is brown. Ink on sage is 5.33:1.

Hence: **the accent is a fill, never a text colour.** `--branch-accent-text`
exists as the colour that *is* safe to set text in — signal on tech, ink on
non-tech. Full reasoning in [[Why the accent is a fill]].

The focus ring is two-tone (ink outline + signal shadow) because no single
colour clears 3:1 on every ground. It is **deliberately unlayered** in CSS —
shadcn's own `focus-visible` utilities live in a cascade layer and would
otherwise outrank it.

## Typography

Three self-hosted families via Fontsource, no Google Fonts request:
**Archivo** (display), **Instrument Sans** (body), **Martian Mono** (utility).
Not Inter — that is the default tell.

Archivo loads the **weight axis only**. The width axis costs 106 KB more
(171 KB vs 65 KB) for a face used sparingly. One import line flips it.

## Torn paper

The signature. `src/lib/torn-edge.ts` holds the geometry; three noise
frequencies are layered — slow drift, mid-band tear, fine fibre — because pure
random at one frequency reads as a stamped filter.

Three things use it:

- **`PaperCutout`** — the torn halo, seeded per member slug
- **The `/performance` seam** — turns with the layout: vertical side by side,
  horizontal when stacked
- **`TornSection`** — a fixed-height strip so each page section reads as its
  own sheet

> [!note] Why the section tear is a strip, not a clip-path
> A percentage polygon scales with its element, so the same tear would be a
> few pixels deep on a short section and enormous on a long one.

## Related

[[Spec drift]] · [[Why the accent is a fill]] · [[Images and uploads]]
