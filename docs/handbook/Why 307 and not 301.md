# Why 307 and not 301

Applies to the [[QR system]] resolver.

**A 301 is cached by browsers effectively forever.** If a member graduates, or
a route changes, every already-printed shirt breaks permanently — with no way
to fix it, because the browser never asks the server again.

A 307 keeps the redirect under the team's control, which is the entire point
of having a QR system rather than printing target URLs directly.

The response also carries `cache-control: no-store`. Without it the hop itself
gets cached and the choice of 307 is pointless.

## The parallel case: language

The **302** on bare `/` and on unprefixed paths is the same reasoning applied
to [[Language system]]. A permanent redirect there would pin a reader to
whichever language they happened to arrive in first, and the switcher on the
home page would appear broken.

## Rule of thumb

> [!important] Nothing language-related or merchandise-related is ever a 301
> If a printed object or a user preference points at it, the redirect must
> stay changeable.

The one place a 307 is *not* used is the admin route guard, which redirects to
sign-in. That is TanStack's default and appropriate — it is a temporary,
session-dependent hop that nothing external points at.
