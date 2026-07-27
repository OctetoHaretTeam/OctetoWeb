# QR system

Every printed surface gets its own code, so the team learns which physical
asset actually drives traffic. That is real, quotable Connect evidence.

`/q/$code` is a **server route**: it renders nothing and ships no client
JavaScript, because it exists only to redirect.

## Behaviour

1. Look up the code
2. Record the scan
3. **307** redirect to the locale-prefixed target

The target is stored **unprefixed** (`/team/andrei`) and the locale is
resolved on the way through — cookie, then `Accept-Language`, then Romanian.
This is the single highest-value place the language system pays off: a judge
at an international event scanning a shirt lands on English without touching
the toggle.

Verified, all 307 with `cache-control: no-store`:

| Code | Romanian browser | English browser |
|---|---|---|
| `pit` | `/ro` | `/en` |
| `robot` | `/ro/performance/tech` | `/en/performance/tech` |
| `sponsor` | `/ro/sponsors` | `/en/sponsors` |
| `portfolio` | `/ro/seasons` | `/en/seasons` |
| `outreach` | `/ro/performance/non-tech` | `/en/performance/non-tech` |

`no-store` matters as much as the 307 — caching the hop itself would defeat
the point of not using a permanent redirect. See [[Why 307 and not 301]].

An unknown **or retired** code goes to `/q/unknown`, a designed page offering
the roster and the home page. Never a raw 404: whoever scanned it was holding
something the team printed.

## What a scan records

Only `qrCodeId`, `scannedAt`, and a coarse two-letter country from edge
headers.

> [!danger] No IPs, no user agents, no precise location, no device IDs, no
> third-party analytics.
> This is the site's only telemetry and it holds nothing personal (§6, §8).
> Placeholders some networks send for unknown (`XX`, `T1`) are discarded
> rather than recorded as if they were countries.

## The write is awaited

§6 asks for the scan log not to block the redirect, and it originally did not
await. **That was reversed** — see [[The database corruption]]. An un-awaited
write is a loose database call that can overlap anything else in flight. A
single indexed insert costs a few milliseconds, which is far cheaper than the
class of bug the alternative buys.

## Code naming

```
m-<memberSlug>   member t-shirt
pit              pit board / banner
robot            robot placard
sponsor          sponsor packet and letters
portfolio        portfolio cover
outreach         workshop handouts
```

> [!important] Slugs are printed on merchandise
> A member slug is permanent once a shirt exists. Changing it breaks a
> physical object you cannot recall.

## Related

[[Language system]] · [[Site structure]] · [[The database corruption]]
