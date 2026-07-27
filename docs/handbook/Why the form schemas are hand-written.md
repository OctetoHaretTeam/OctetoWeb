# Why the form schemas are hand-written

Admin form schemas live in `src/lib/forms/` as **plain Zod**, not derived from
the Drizzle tables with `drizzle-zod`.

## The reason

§10 requires Zod validation on the client as well as the server. So whatever a
form imports **ships to the browser**.

Importing a drizzle-derived schema pulled `drizzle-orm` and `drizzle-zod` into
the public client bundle and roughly **doubled it** — the leak check caught
`drizzle` in a chunk that every public page loads.

## The rule

> [!danger] Admin forms import their schema from `@/lib/forms/`, never from
> `@/server/admin/`.

## What keeps them honest

Duplication is only safe if drift is impossible. `team-member.test.ts` and its
siblings parse a valid form value **through the drizzle-derived insert
schema**, so the hand-written contract cannot drift from the real table
without a test failing. Tests are not bundled, so importing the drizzle schema
there costs the browser nothing.

The tests also assert the form never exposes `id`, `createdAt` or `updatedAt`.

## A related trap in the same family

The same "what does the client import" question produced two more rules, both
in [[Auth and admin]]:

- do not re-export server-only modules through a barrel a route imports
- `adminMiddleware` is referenced from a builder chain evaluated at module
  scope, so its server imports must be dynamic

All three are the same underlying mistake: **assuming that because code only
*runs* on the server, it does not *ship* to the client.**

## Related

[[Stack]] · [[Auth and admin]] · [[Open questions]]
