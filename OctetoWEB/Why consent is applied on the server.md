# Why consent is applied on the server

Members are 14–18. `photoConsent` and `fullNamePublic` both default to
**false**: no photograph, and first name + last initial only.

## The bug this prevents

The consent checks were originally in the **component**. That looked correct
and rendered correctly — masked name, placeholder avatar, no `<img>`.

But a route loader's return value is **serialised into the HTML so the client
can hydrate**. Verified: `photoConsent:!1` was sitting in the page source.

> [!danger] So for a member with a photo and consent withheld, the photo URL
> and the full surname would have been in view-source.
> Never rendered — but trivially retrievable. Precisely what §8 forbids.

## The fix

`src/server/team.ts` strips `name`, `photoConsent` and `fullNamePublic`, and
returns a `displayName` plus only a photo the site is allowed to show. The
withheld data never leaves the server.

Verified afterwards: **zero occurrences** of `photoConsent`, `fullNamePublic`
or the raw `name` in the page source, with rendering unchanged.

## The general rule

> [!important] Apply privacy rules at the server boundary, not in the
> component that renders them.
> Anything a loader returns is readable in view-source whether it renders or
> not.

This also covers news bylines: author names go through `publicDisplayName`, so
a minor's surname does not appear on an article without consent.

## Where it still applies

`<title>` and `og:` tags are the two spots §8 calls out specifically, because
they are easiest to forget. Verified on the member profile: title, `og:title`
and `h1` all show the masked form.

## Related

[[Auth and admin]] · [[Database]] · [[Bugs found and fixed]]
