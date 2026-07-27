# Why the accent is a fill

`CLAUDE.md` §7.3 assigns each branch an accent: signal for tech, **gold for
non-tech**. The non-tech ground is sage.

## The measurement

| Pairing | Ratio | Verdict |
|---|---|---|
| gold on sage | **1.97:1** | fails, badly |
| signal on sage | **2.49:1** | fails |
| paper on sage | 2.90:1 | fails |
| ink on sage | 5.33:1 | passes |
| **ink on gold** | **10.50:1** | passes comfortably |

Gold on sage is worse than the signal pairing the brief warned about — and it
is the one §7.3 actually specifies.

## Darkening does not rescue it

Sage is a **mid-tone**, so no chromatic accent clears 4.5:1 against it. A
sweep of both accents:

- gold reaches only 3.15:1 at 0.3× brightness, by which point it is brown
- signal maxes out at 2.85:1

So the fix has to be structural, not a colour tweak.

## The rule

> [!important] `--branch-accent` is a fill. It is never a text colour.
> `--branch-accent-text` is the token that *is* safe to set text in: signal on
> tech, **ink** on non-tech.

Gold behind ink text measures 10.50:1. The emphasis survives; the failure
does not.

## It is enforced by tests, not by a comment

`contrast.test.ts` asserts that gold and signal **fail** on sage — so the
constraint cannot be forgotten — and that every branch's text, muted text and
accent-text pairing clears AA. If a future palette change makes gold legible
on sage, the test fails and the rule gets relaxed deliberately rather than by
accident.

## The same trap, elsewhere

The hero watermark hit this from the other side. The tagline was
`--branch-muted` (sage on ink, 5.33:1 to start with) and a watermark at just
**10% opacity** pushed it under AA. Promoting the tagline to `--branch-text`
removed the constraint and allowed a visible 18% watermark — at which point
the hero text still measures 9.83:1.

## Related

[[Design system]] · [[Open questions]]
