# Auth and admin

## Zero user database

No users table, no registration, no password reset. The entire authorization
decision is: **is the Google profile email in `ALLOWED_ADMIN_EMAILS`.**

That gives each team member their own login with no shared password. Adding or
removing someone is one environment-variable edit — and because the allowlist
is re-checked on *every request*, removing an address locks that person out
immediately, even mid-session.

`ALLOWED_ADMIN_EMAILS` is server-side only. **Never give it a `VITE_` prefix.**

## Sign-in

Google authorization-code flow with `state` and PKCE, both held in a sealed
single-use cookie. Every failure — bad state, failed exchange, unverified
address, address not on the list — returns **the same bare 403** and creates no
record. A distinguishable response would turn the callback into an oracle for
"is this person an OctetoHaret admin?".

`email_verified` is checked, or someone could claim an admin's address on an
account they control. `returnTo` is constrained to `/admin` and below, so the
query string cannot bounce a freshly authenticated admin to another origin.

## Session

A sealed, signed, `httpOnly`, `secure`, `sameSite=lax` cookie carrying only
the email. Stateless — there is no sessions table either. Eight-hour sliding
window, refreshed on activity, configurable by env var.

## The rule that is easy to get wrong

> [!danger] A route guard is not an authorization boundary
> `/admin/_authed`'s `beforeLoad` only stops someone loading a screen that
> would fail anyway. **A server function is an endpoint reachable on its own.**
> Every one that touches admin data must carry `adminMiddleware`.

CSRF: the `Origin` header is compared in full — scheme, host and port — on
every non-GET request. Host alone would let `http://` pass a check meant for
`https://`.

## Two bundle traps this created

> [!warning] Do not re-export `./middleware` or `./session` from `@/server/auth`
> That barrel is imported by route files, which are part of the client build.
> Re-exporting server-only modules through it fails import protection.

> [!warning] `adminMiddleware` is referenced from a builder chain
> `.middleware([adminMiddleware])` is evaluated at module scope, so a
> top-level `@tanstack/react-start/server` import in that file reaches the
> client build. The checks live in `guards.server.ts`, reached by dynamic
> import from inside the `.server()` callbacks, which *are* stripped.

## The panel

Romanian-only — it is for the team, not the public. Nine sections plus a
dashboard that leads with QR scan statistics.

Every editor has: side-by-side RO/EN fields with English marked optional,
localStorage draft autosave keyed per record (cleared only after a save
actually succeeds), confirm dialogs whose button says what happens, and
keyboard-accessible reordering — drag alone would fail the accessibility
requirement, so every row also has move up/down buttons with `aria-live`.

## Related

[[Why consent is applied on the server]] · [[Environment variables]] · [[QR system]]
