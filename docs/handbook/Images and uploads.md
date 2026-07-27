# Images and uploads

## EXIF is stripped in the browser

Every uploaded image is decoded and re-encoded through a canvas **before a
single byte is uploaded**. Encoding from raw pixels cannot carry metadata
forward, so a photo's GPS coordinates never leave the member's device — not
even to be cleaned up server-side.

This matters because members are 14–18 and phone photos carry location.

Re-encoding also does two other jobs:

- **EXIF orientation is applied during decode**, so a portrait photo stays
  portrait once the flag carrying that is discarded
- **Exact dimensions come back**, which is what lets every image reserve its
  box before it loads and keeps CLS at zero

## What is accepted

JPEG, PNG, WebP, AVIF in; WebP out. Enforced in the browser **and again** on
the server, because the client is not a control.

> [!danger] SVG is deliberately excluded
> It can carry scripts. An admin upload is still untrusted input as far as the
> browser is concerned.

Size cap 12 MB in, 8 MB stored.

## Two stores

- **Vercel Blob** when `BLOB_READ_WRITE_TOKEN` is set. Production.
- **`public/uploads/`** when it is not. Local development only.

> [!note] Why local uploads live under `public/`
> They were originally written to `.uploads/` and served by a dedicated route.
> That route was never reached: a request ending in `.webp` is claimed by
> Vite's static-asset middleware before TanStack's router sees it, so every
> image 404'd with a bare `Cannot GET`. Confirmed by requesting the same route
> **without** a file extension, which the handler did answer.
>
> Serving from `public/` removes the route entirely — fewer moving parts, and
> no path-traversal surface of our own to defend.

`public/uploads/` is gitignored. `public/logo.webp` is not — it is a committed
brand asset.

## Alt text

Bilingual and **required in Romanian**. An image saved without it is one
nobody remembers to come back for.

The image fields flag a missing alt inline, because it starts empty after an
upload and was previously the invisible reason a save was refused — see
[[Bugs found and fixed]].

## Related

[[Design system]] · [[Environment variables]] · [[Bugs found and fixed]]
