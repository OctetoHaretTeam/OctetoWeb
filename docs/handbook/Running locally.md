# Running locally

```bash
bun install
bun run dev          # http://localhost:3000
```

> [!note] `bun` may not be on PATH in a fresh shell
> It lives at `~/.bun/bin/bun.exe` on this machine.

## The local database

Until a Neon project exists, the app runs on **PGlite** — an in-process
Postgres in `.pglite/`. Chosen automatically when `DATABASE_URL` is unset, and
**refused outright in production**.

```bash
bun run db:local     # apply committed migrations to a fresh database
bun run db:seed      # placeholder content, safe to re-run
```

> [!warning] PGlite allows a single writer
> Stop the dev server before running `db:local`, `db:seed` or `db:restore`,
> then start it again. Running a script against a directory the dev server has
> open is how [[The database corruption]] started.

Running the production build without `DATABASE_URL` returns **500** on any
page that touches data. That is the guard working, not a bug.

## Backups

```bash
bun run db:backup    # JSON dump, written outside the data directory
bun run db:restore   # round-tripped into a freshly built database
bun run db:reset     # rebuild from migrations + seed
```

> [!danger] Dumps are gitignored and must stay that way
> They contain member names and the `photoConsent` / `fullNamePublic` flags.
> Committing one publishes exactly what those flags exist to withhold.

**Take a backup before entering a batch of content.**

## Signing in to the admin panel

Needs Google OAuth credentials in `.env` — see [[Environment variables]]. The
redirect URI must be exactly:

```
http://localhost:3000/api/auth/callback/google
```

and the signing-in address must be **both** in `ALLOWED_ADMIN_EMAILS` *and* a
test user on the Google Cloud consent screen. Missing the second is the usual
cause of "Access blocked".

## Verifying work

```bash
bun run typecheck
bun test
bun run build
```

Two checks worth doing by hand, because they catch what the above cannot:

- **`curl` the routes.** Status codes, redirect targets, headers, and what is
  actually in the server-rendered HTML.
- **Grep the built bundle** in `.output/public/assets/` for `drizzle`,
  `SESSION_SECRET`, `ALLOWED_ADMIN_EMAILS` and server symbols.

After editing routes: `bun run generate-routes`.

## Related

[[Environment variables]] · [[The database corruption]] · [[Stack]]
