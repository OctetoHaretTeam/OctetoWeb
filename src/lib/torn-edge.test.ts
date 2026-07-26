import { describe, expect, test } from 'bun:test'

import {
  hashSeed,
  makeTearProfile,
  mulberry32,
  tornOutlinePath,
  tornSeamPolygon,
} from './torn-edge'

/**
 * The edge must be deterministic: a member's tear cannot change between
 * renders, or between the server-rendered HTML and hydration.
 */
describe('determinism', () => {
  test('the same seed gives the same hash', () => {
    expect(hashSeed('andrei')).toBe(hashSeed('andrei'))
    expect(hashSeed('andrei')).not.toBe(hashSeed('maria'))
  })

  test('the same seed gives the same sequence', () => {
    const a = Array.from({ length: 5 }, mulberry32(42))
    const b = Array.from({ length: 5 }, mulberry32(42))
    expect(a).toEqual(b)
  })

  test('the same seed gives the same outline', () => {
    const opts = { seed: hashSeed('andrei'), inset: 0.035, amplitude: 0.035 }
    expect(tornOutlinePath(opts)).toBe(tornOutlinePath(opts))
  })

  test('different seeds give different outlines', () => {
    const base = { inset: 0.035, amplitude: 0.035 }
    expect(tornOutlinePath({ ...base, seed: hashSeed('andrei') })).not.toBe(
      tornOutlinePath({ ...base, seed: hashSeed('maria') }),
    )
  })
})

describe('the tear profile drifts rather than jumping', () => {
  test('stays within bounds', () => {
    const profile = makeTearProfile(hashSeed('x'))
    for (let i = 0; i <= 100; i++) {
      const v = profile(i / 100)
      expect(v).toBeGreaterThanOrEqual(-1)
      expect(v).toBeLessThanOrEqual(1)
    }
  })

  test('neighbouring samples are close — a zigzag would fail this', () => {
    const profile = makeTearProfile(hashSeed('x'))
    for (let i = 0; i < 200; i++) {
      const delta = Math.abs(profile(i / 200) - profile((i + 1) / 200))
      expect(delta).toBeLessThan(0.35)
    }
  })

  test('wraps, so a closed path has no seam', () => {
    const profile = makeTearProfile(hashSeed('x'))
    expect(Math.abs(profile(0) - profile(1))).toBeLessThan(0.0001)
  })
})

describe('tornOutlinePath stays inside its box', () => {
  test('every coordinate is within 0..1', () => {
    const d = tornOutlinePath({
      seed: hashSeed('andrei'),
      inset: 0.035,
      amplitude: 0.035,
    })
    for (const n of d.match(/-?\d*\.?\d+/g)!.map(Number)) {
      expect(n).toBeGreaterThanOrEqual(0)
      expect(n).toBeLessThanOrEqual(1)
    }
  })

  test('is a closed path', () => {
    const d = tornOutlinePath({ seed: 1, inset: 0.03, amplitude: 0.03 })
    expect(d.startsWith('M')).toBe(true)
    expect(d.endsWith('Z')).toBe(true)
  })
})

describe('tornSeamPolygon', () => {
  test('produces a valid CSS polygon', () => {
    const p = tornSeamPolygon({ seed: 'perf', direction: 'horizontal' })
    expect(p.startsWith('polygon(')).toBe(true)
    expect(p.endsWith(')')).toBe(true)
  })

  test('every percentage stays within 0..100', () => {
    for (const direction of ['horizontal', 'vertical'] as const) {
      const p = tornSeamPolygon({ seed: 'perf', direction, amplitude: 40 })
      for (const n of p.match(/-?\d*\.?\d+(?=%)/g)!.map(Number)) {
        expect(n).toBeGreaterThanOrEqual(0)
        expect(n).toBeLessThanOrEqual(100)
      }
    }
  })

  test('the two directions differ, so the seam turns with the layout', () => {
    expect(tornSeamPolygon({ seed: 'perf', direction: 'horizontal' })).not.toBe(
      tornSeamPolygon({ seed: 'perf', direction: 'vertical' }),
    )
  })

  test('is stable for a given seed and direction', () => {
    const opts = { seed: 'perf', direction: 'vertical' } as const
    expect(tornSeamPolygon(opts)).toBe(tornSeamPolygon(opts))
  })
})
