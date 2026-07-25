import { describe, expect, test } from 'bun:test'

import {
  contrastRatio,
  formatRatio,
  parseHex,
  passesAA,
  relativeLuminance,
} from './contrast'
import { BRANCH_TREATMENTS, BRAND_PALETTE } from './palette'

describe('contrast maths', () => {
  test('matches the known extremes', () => {
    expect(contrastRatio('#000000', '#ffffff')).toBeCloseTo(21, 5)
    expect(contrastRatio('#ffffff', '#ffffff')).toBeCloseTo(1, 5)
  })

  test('is symmetric', () => {
    expect(contrastRatio('#0a0c09', '#e9e4d6')).toBeCloseTo(
      contrastRatio('#e9e4d6', '#0a0c09'),
      10,
    )
  })

  test('accepts shorthand hex and a leading hash either way', () => {
    expect(parseHex('#fff')).toEqual({ r: 255, g: 255, b: 255 })
    expect(parseHex('000')).toEqual({ r: 0, g: 0, b: 0 })
  })

  test('rejects anything that is not a hex colour', () => {
    expect(() => parseHex('rebeccapurple')).toThrow()
    expect(() => parseHex('#12345')).toThrow()
  })

  test('luminance is ordered as expected', () => {
    expect(relativeLuminance('#ffffff')).toBeCloseTo(1, 5)
    expect(relativeLuminance('#000000')).toBeCloseTo(0, 5)
    expect(relativeLuminance(BRAND_PALETTE.paper)).toBeGreaterThan(
      relativeLuminance(BRAND_PALETTE.sage),
    )
  })

  test('formats the way ratios are conventionally written', () => {
    expect(formatRatio(5.3312)).toBe('5.33:1')
  })
})

/**
 * These are the accessibility guarantees of §7.7, expressed as tests rather
 * than as a comment. If someone edits a hex in theme.css and a pairing stops
 * clearing AA, this fails instead of shipping.
 */
describe('branch treatments clear WCAG AA', () => {
  for (const [branch, t] of Object.entries(BRANCH_TREATMENTS)) {
    const ground = BRAND_PALETTE[t.ground]
    const surface = BRAND_PALETTE[t.surface]

    test(`${branch}: body text on the ground`, () => {
      expect(passesAA(contrastRatio(BRAND_PALETTE[t.text], ground))).toBe(true)
    })

    test(`${branch}: muted text on the ground`, () => {
      expect(passesAA(contrastRatio(BRAND_PALETTE[t.muted], ground))).toBe(true)
    })

    test(`${branch}: body text on the raised surface`, () => {
      expect(passesAA(contrastRatio(BRAND_PALETTE[t.text], surface))).toBe(true)
    })

    test(`${branch}: accent text on the ground`, () => {
      expect(
        passesAA(contrastRatio(BRAND_PALETTE[t.accentText], ground)),
      ).toBe(true)
    })

    test(`${branch}: ink reads on the accent used as a fill`, () => {
      expect(
        passesAA(contrastRatio(BRAND_PALETTE.ink, BRAND_PALETTE[t.accent])),
      ).toBe(true)
    })
  }
})

/**
 * The reason `--branch-accent` is documented as a fill and never a text
 * colour. If a future palette change makes gold legible on sage, this test
 * fails and the rule can be relaxed deliberately rather than by accident.
 */
describe('the sage ground constraint', () => {
  test('gold is not legible as text on sage', () => {
    const ratio = contrastRatio(BRAND_PALETTE.gold, BRAND_PALETTE.sage)
    expect(ratio).toBeLessThan(4.5)
  })

  test('signal is not legible as text on sage', () => {
    const ratio = contrastRatio(BRAND_PALETTE.signal, BRAND_PALETTE.sage)
    expect(ratio).toBeLessThan(4.5)
  })

  test('ink is, which is why non-tech text is ink', () => {
    expect(
      passesAA(contrastRatio(BRAND_PALETTE.ink, BRAND_PALETTE.sage)),
    ).toBe(true)
  })
})

/**
 * The two-tone focus ring in app.css. At least one of its colours must clear
 * 3:1 against every ground the site uses, or the ring is invisible somewhere.
 */
describe('focus ring is visible on every ground', () => {
  const grounds = ['ink', 'carbon', 'slate', 'sage', 'paper'] as const

  for (const ground of grounds) {
    test(`on ${ground}`, () => {
      const inner = contrastRatio(BRAND_PALETTE.ink, BRAND_PALETTE[ground])
      const outer = contrastRatio(BRAND_PALETTE.signal, BRAND_PALETTE[ground])
      expect(Math.max(inner, outer)).toBeGreaterThanOrEqual(3)
    })
  }
})
