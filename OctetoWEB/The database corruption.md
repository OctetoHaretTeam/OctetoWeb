# The database corruption

The worst incident of the build. Recorded in full because the root cause is
**unproven**, and someone hitting it again needs to know what was ruled out.

## What happened

While adding home slides through the admin panel, the local PGlite database
aborted mid-use and left a data directory that PGlite **could no longer open
at all** — no repair, no partial read. Every page 500'd until the dev server
was restarted, and the content entered locally was unrecoverable.

## What could not be established

> [!warning] The abort is not reproducible from concurrency alone.
> The same pattern — one write against five parallel reads — survived twelve
> rounds unserialised. Nor did two instances on one directory reproduce it
> over a short burst.

So the root cause is **unproven**, and none of the changes below is claimed as
"the fix".

## What is true regardless

Four changes, each defensible on its own merits:

1. **Every call to the local client is queued**, so nothing overlaps. Costs
   nothing on sub-millisecond local queries and removes a class of risk.

2. **The local client is cached on `globalThis`**, not in a module variable.
   The dev server re-evaluates modules on change and this one opens a
   connection at import — so *each reload was opening another instance on the
   same directory*. Two instances do not share a page cache. This was **proven
   during testing**: rows written by a script were invisible to the running
   server.

3. **The QR scan write is awaited** instead of fire-and-forget. See
   [[QR system]].

4. **`db:backup` / `db:restore` / `db:reset`.** The dump is JSON written
   *outside* the data directory, so a corrupted database cannot take the
   backup with it. Verified by round-tripping a full dump into a freshly built
   database.

## The follow-up mistake

The first backup reached a commit. It held only placeholder seed data so
nothing real was exposed — but the `.gitignore` rule was **actively wrong**:
it un-ignored the directory rather than ignoring it.

> [!danger] The next backup taken after real content was entered would have
> gone straight into git.
> Dumps contain member names and the `photoConsent` / `fullNamePublic` flags.
> Committing one would publish exactly what those flags exist to withhold.

Fixed. The dumps stay on disk — they are the only copy of local content — they
just do not belong in the repository.

## Lessons

- **Take a backup before bulk content entry.** `bun run db:backup`.
- Un-awaited database calls are not free, even when the latency argument for
  them is sound.
- A `.gitignore` rule that *looks* right should be tested with
  `git check-ignore`, which is how this one was caught.

## Related

[[Running locally]] · [[QR system]] · [[Bugs found and fixed]]
