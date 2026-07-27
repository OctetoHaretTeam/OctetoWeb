# Language system

Romanian is the default and the team's own language. English is what
international judges and sponsors read. Both are first-class.

## Routing

- Locale prefix on every public URL. No unprefixed content routes.
- Bare `/` resolves **cookie → `Accept-Language` → `ro`**, then redirects
  **302**. Not 301: a permanent redirect is cached indefinitely and would pin
  a reader to whichever language they first arrived in.
- An unprefixed path like `/team/andrei` also redirects into the reader's
  language. This is the same shape QR targets are stored in.

Verified over HTTP, not assumed:

| Request | Result |
|---|---|
| `/` no cookie, no header | 302 → `/ro` |
| `/` `Accept-Language: en-US` | 302 → `/en` |
| `/` `fr-FR,fr;q=0.9,ro;q=0.8` | 302 → `/ro` (skips unsupported) |
| `/` cookie `ro` + header `en-US` | 302 → `/ro` (cookie wins) |
| `/team/andrei` + `en-US` | 302 → `/en/team/andrei` |

## The switcher

Real `<a>` elements, **server-rendered**, both options always present. It
works before hydration and with JavaScript off — which matters, because on
congested venue wifi it is often the first thing a judge taps.

It links to the **equivalent page**: `/ro/team/andrei` → `/en/team/andrei`,
never back to the home page. Text labels, never flags — Romanian is spoken in
both Moldova and Romania, and English has no single country.

> [!warning] On unprefixed routes it links to the locale roots
> `/styleguide`, `/q/` and `/admin` have no localised equivalent. An earlier
> version blindly prefixed the current path and produced 404 links.

## Content fallback

`getLocalized(field, locale)` returns `{ value, isFallback, resolvedLocale }`
— deliberately not a bare string, so the "available in Romanian only" note can
never be silently dropped. Render bilingual fields with `<LocalizedText>`
rather than reading `…En ?? …Ro` inline.

The `lang` attribute is set to the language the text is *actually* in, which
is what stops a screen reader reading Romanian with an English voice.

## UI strings

Typed dictionaries in `src/i18n/dictionaries/`. `ro.ts` is the reference and
`en.ts` is typed as `Dictionary`, so **a missing key is a build error**, not a
blank button at a competition. Tests also assert English is not a copy-paste
of Romanian.

Deliberately not `as const`: literal types would force English to repeat the
Romanian strings verbatim.

## Related

[[Site structure]] · [[QR system]] · [[Why 307 and not 301]]
