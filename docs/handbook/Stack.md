# Stack

Fixed by `CLAUDE.md` §3. Treat the left column as non-negotiable unless the
team decides otherwise in writing.

| Layer | Choice |
|---|---|
| Runtime / package manager | **Bun** — never npm/yarn/pnpm. `bun.lock` is committed |
| Framework | React + Vite + TypeScript, `strict: true` |
| Routing / full-stack | **TanStack Start**, file-based routing only |
| Styling | **Tailwind CSS v4**, CSS-first `@theme`. No v3 config file |
| Components | shadcn/ui |
| Icons | lucide-react |
| Database | **Neon** (serverless Postgres) |
| ORM | **Drizzle** + drizzle-kit, migrations committed |
| File storage | **Vercel Blob** — Postgres stores no files |
| Validation | **Zod** |
| Deploy | Vercel |

**Banned outright:** `react-router-dom`, Next.js App Router patterns,
`next/image`, `next/link`, any Next-specific API.

## Additions made during the build

Three dependencies were added that §3's table does not list. Each is a
utility, not a framework choice:

- **`markdown-it`** — renders `body` fields. Server-only (see
  [[Site structure]]); never reaches the browser.
- **`@electric-sql/pglite`** — a dev-only in-process Postgres so the site
  could be built before a Neon project existed. See [[Running locally]].
- **Fontsource packages** for the three self-hosted fonts.

## Things that bite

> [!warning] `verbatimModuleSyntax` must stay off
> The scaffolder enabled it. TanStack Start's docs warn it can leak server
> bundles into the client, and this project has `ALLOWED_ADMIN_EMAILS` and
> `SESSION_SECRET` to keep server-side. It is disabled with a comment saying
> so — do not turn it back on.

> [!warning] Tailwind v4 tree-shakes unused `@theme` variables
> Which made `var(--color-signal)` resolve to *nothing* in raw CSS and SVG.
> The brand block uses `@theme static` so every token is emitted whether or
> not a utility references it.

> [!warning] Class names must be literal strings
> Tailwind finds utilities by scanning source text. `text-${size}` is never
> generated — it silently renders at the inherited size. Write the full class
> name out.

## Related

[[Site structure]] · [[Running locally]] · [[Open questions]]
