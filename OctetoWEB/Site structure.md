# Site structure

Every public route is locale-prefixed (`/ro/…`, `/en/…`). `/q/`, `/admin/`,
`/api/` and `/styleguide` deliberately are not — see [[Language system]].

## Public

| Route | What it is |
|---|---|
| `/` | Resolves locale, **302** redirect. No page |
| `/$locale` | Home — hero, award strip, stats, latest news, sponsors |
| `/$locale/news` · `/$locale/news/$slug` | News index and article |
| `/$locale/performance` | Overview — the two branches, torn seam between them |
| `/$locale/performance/$branch` | Branch index (`tech` / `non-tech`) |
| `/$locale/performance/$branch/$slug` | Single entry |
| `/$locale/seasons` · `/$locale/seasons/$slug` | Season archive |
| `/$locale/team` · `/$locale/team/$slug` | Roster and member profile |
| `/$locale/sponsors` | Sponsor wall |
| `/$locale/about` | Origin story, gallery, contacts |

> [!important] `/team/$slug` is the QR destination
> It is the most important page on the site. Someone arrives there by
> scanning a shirt, with no prior page and no warm cache. Keep it fast and
> keep it standalone.

## Not locale-prefixed

| Route | What it is |
|---|---|
| `/q/$code` | QR resolver — redirect only, see [[QR system]] |
| `/q/unknown` | Designed landing for an unknown or retired code |
| `/admin/*` | Admin panel, Romanian-only, see [[Auth and admin]] |
| `/api/auth/*` | Google OAuth start, callback, sign-out |
| `/api/upload` | Image upload endpoint, admin-guarded |
| `/styleguide` | Internal design review page, `noindex` |

## Rules that are easy to break

> [!danger] Every public route belongs under `src/routes/$locale/`
> An unprefixed content route is invisible to the language system: no
> `hreflang`, and the switcher can only send readers to the locale home
> rather than the equivalent page.

> [!danger] Public queries must filter drafts
> `publishedAt IS NULL` is a draft and a future date is scheduled. Neither may
> appear publicly. The **admin** queries deliberately do not filter — so the
> two must never share a code path.

Markdown bodies are rendered **on the server**, inside the query, so
`markdown-it` never reaches the client bundle. Raw HTML is disabled at the
renderer, which is what makes `dangerouslySetInnerHTML` safe on those pages:
the source *cannot* contain markup.

## Related

[[Language system]] · [[QR system]] · [[Database]]
