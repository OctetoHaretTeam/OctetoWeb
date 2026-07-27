# OctetoHaret — project vault

Working knowledge for the OctetoHaret website (FIRST Tech Challenge team
**#25474**, IPLT „Spiru Haret", Chișinău).

This vault holds the **context that is not in the code**: why decisions were
made, what was tried and rejected, what is still open. The code says what the
site does; these notes say why it does it that way.

> [!info] Language
> Written in English, matching `CLAUDE.md` and every code comment in the repo,
> because these notes quote identifiers constantly. The **admin panel itself
> is Romanian-only** — that is a product decision, not a documentation one.

---

## Start here

- [[Team and audiences]] — who this is for, and why that drives everything
- [[Stack]] — what the site is built on, and what is banned
- [[Site structure]] — every route and what it is for
- [[Spec drift]] — **where the site now disagrees with `CLAUDE.md`**
- [[Open questions]] — what still needs a decision or an answer

## Architecture

- [[Database]] — schema, the bilingual column pairs, seed discipline
- [[Language system]] — RO/EN routing, the switcher, fallback rule
- [[Design system]] — palette, torn paper, the two branches
- [[Auth and admin]] — Google sign-in, the allowlist, the admin panel
- [[QR system]] — `/q/$code`, the 307, what a scan records
- [[Images and uploads]] — EXIF stripping, Blob, the local store

## Decisions

- [[Why 307 and not 301]]
- [[Why the accent is a fill]]
- [[Why consent is applied on the server]]
- [[Why the form schemas are hand-written]]

## Operating it

- [[Running locally]] — dev server, local database, backups
- [[Environment variables]] — what each one does and where it lives

## History

- [[Bugs found and fixed]] — the real ones, with their causes
- [[The database corruption]] — what happened, what is still unproven

---

## Current state

As of the last verified run on this branch (`feat/schema-design-system-i18n`):

| | |
|---|---|
| Typecheck | clean |
| Tests | **219 passing**, 0 failing |
| Build | clean, no import-protection violations |
| Public routes | home, team, news, seasons, sponsors, performance, about |
| Admin sections | all nine, plus the dashboard |
| QR resolver | live, every seeded code resolves |

**Not yet done:** production database (Neon), Blob token, the exact brand
hexes, and the performance budget decision in [[Open questions]].
