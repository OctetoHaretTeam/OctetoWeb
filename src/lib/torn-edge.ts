/**
 * Torn-edge geometry — CLAUDE.md §7.4.
 *
 * Shared by `PaperCutout` and the `/performance` seam. Only the MATHS is
 * shared: §7.4 restricts the signature — a torn halo around a person — to team
 * cards, profiles and non-tech covers. A seam between two halves of a page is
 * a different element that happens to need the same kind of edge, so the
 * generator moved here rather than the component being reused.
 *
 * Everything is deterministic: the same seed always produces the same edge, so
 * a member's tear never changes between renders or between server and client.
 */

/** FNV-1a. Small, fast, stable across platforms — no crypto needed. */
export function hashSeed(seed: string): number {
  let h = 0x811c9dc5
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i)
    h = Math.imul(h, 0x01000193)
  }
  return h >>> 0
}

/** mulberry32 — deterministic PRNG from a 32-bit seed. */
export function mulberry32(seed: number): () => number {
  let a = seed
  return () => {
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/**
 * Wrapping value noise. Interpolating between a ring of random values gives a
 * signal that drifts instead of jumping, which is what stops an edge reading
 * as a zigzag. The ring wraps, so a closed path has no seam.
 */
export function makeNoise(
  rand: () => number,
  steps: number,
): (t: number) => number {
  const points = Array.from({ length: steps }, () => rand() * 2 - 1)

  return (t: number) => {
    const x = ((((t % 1) + 1) % 1) * steps)
    const i = Math.floor(x) % steps
    const j = (i + 1) % steps
    const f = x - Math.floor(x)
    const s = f * f * (3 - 2 * f) // smoothstep
    return points[i]! * (1 - s) + points[j]! * s
  }
}

/**
 * Three frequencies layered: a slow drift so one stretch differs from another,
 * a mid band that forms the actual tear, and a fine tremor for fibre. Pure
 * random at one frequency looks like a stamped filter; this does not.
 */
export function makeTearProfile(seed: number): (t: number) => number {
  const rand = mulberry32(seed)
  const drift = makeNoise(rand, 5)
  const tear = makeNoise(rand, 17)
  const fibre = makeNoise(rand, 53)

  /*
   * Every layer is sampled at `t` itself, never at a fraction of it. The
   * noise ring wraps at 1, so `drift(t * 0.5)` completed only half a loop and
   * left a visible step where a closed outline joined back up. The slowness of
   * the drift comes from its short ring (5 points), not from scaling `t`.
   */
  return (t: number) => drift(t) * 0.45 + tear(t) * 0.4 + fibre(t) * 0.15
}

const round = (v: number) => Math.round(v * 1000) / 1000
const clamp = (v: number, lo: number, hi: number) =>
  v < lo ? lo : v > hi ? hi : v

export type SeamDirection = 'horizontal' | 'vertical'

/**
 * A CSS `polygon()` covering the region on one side of a torn edge.
 *
 * Percentages rather than pixels, so one value works at any size and can be
 * swapped per breakpoint from a media query — which is how the `/performance`
 * seam runs horizontally when the halves stack and vertically when they sit
 * side by side.
 *
 * `horizontal` tears across the top edge; `vertical` tears down the left edge.
 */
export function tornSeamPolygon({
  seed,
  direction,
  segments = 48,
  amplitude = 2.4,
  inset = 3,
}: {
  seed: string
  direction: SeamDirection
  /** Vertices along the tear. More gives finer fibre. */
  segments?: number
  /** Peak deviation, in percent of the box. */
  amplitude?: number
  /** How far the tear sits from the edge, in percent. */
  inset?: number
}): string {
  const profile = makeTearProfile(hashSeed(`${seed}:${direction}`))
  const points: string[] = []

  for (let i = 0; i <= segments; i++) {
    const t = i / segments
    const offset = clamp(inset + profile(t) * amplitude, 0, 100)

    points.push(
      direction === 'horizontal'
        ? `${round(t * 100)}% ${round(offset)}%`
        : `${round(offset)}% ${round(t * 100)}%`,
    )
  }

  // Close around the far side so the polygon covers everything past the tear.
  if (direction === 'horizontal') {
    points.push('100% 100%', '0% 100%')
  } else {
    points.push('100% 100%', '100% 0%')
  }

  return `polygon(${points.join(', ')})`
}

/**
 * A closed torn outline in 0..1 coordinates, for `clipPathUnits`
 * `objectBoundingBox` — the shape `PaperCutout` is built from.
 */
export function tornOutlinePath({
  seed,
  inset,
  amplitude,
  segments = 132,
  phase = 0,
}: {
  seed: number
  inset: number
  amplitude: number
  segments?: number
  phase?: number
}): string {
  const profile = makeTearProfile(seed)
  const commands: string[] = []

  for (let i = 0; i < segments; i++) {
    const t = i / segments
    const displacement = profile(t + phase)
    const { point, normal } = perimeter(t)

    // Bias inward: the shape must stay inside its box or the tear is clipped.
    const offset = inset + amplitude * (displacement * 0.5 - 0.5)
    const x = clamp(point.x - normal.x * offset, 0, 1)
    const y = clamp(point.y - normal.y * offset, 0, 1)

    commands.push(`${i === 0 ? 'M' : 'L'}${round4(x)} ${round4(y)}`)
  }

  commands.push('Z')
  return commands.join('')
}

const round4 = (v: number) => Math.round(v * 10000) / 10000

type Point = { x: number; y: number }

/** Maps a perimeter position on the unit square to a point and its normal. */
function perimeter(t: number): { point: Point; normal: Point } {
  const u = ((t % 1) + 1) % 1

  if (u < 0.25) {
    return { point: { x: u * 4, y: 0 }, normal: { x: 0, y: -1 } }
  }
  if (u < 0.5) {
    return { point: { x: 1, y: (u - 0.25) * 4 }, normal: { x: 1, y: 0 } }
  }
  if (u < 0.75) {
    return { point: { x: 1 - (u - 0.5) * 4, y: 1 }, normal: { x: 0, y: 1 } }
  }
  return { point: { x: 0, y: 1 - (u - 0.75) * 4 }, normal: { x: -1, y: 0 } }
}

/**
 * A torn edge as an SVG path, for a strip laid across the top of a section.
 *
 * Used instead of `clip-path` on the section itself because a percentage-based
 * polygon scales with the element: the same tear would be a few pixels deep on
 * a short section and enormous on a long one. A fixed-height strip keeps every
 * tear on the page the same weight.
 *
 * The path fills DOWNWARD from the tear, so the strip is painted in the
 * section's own colour and reads as that sheet lying over the one above it.
 */
export function tornEdgeSvgPath({
  seed,
  segments = 64,
  amplitude = 3.2,
  height = 10,
}: {
  seed: string
  segments?: number
  /** Peak deviation, in viewBox units. */
  amplitude?: number
  /** viewBox height. The path spans 0..100 horizontally. */
  height?: number
}): string {
  const profile = makeTearProfile(hashSeed(seed))
  const mid = height / 2
  const commands: string[] = []

  for (let i = 0; i <= segments; i++) {
    const t = i / segments
    const y = clamp(mid + profile(t) * amplitude, 0, height)
    commands.push(`${i === 0 ? 'M' : 'L'}${round(t * 100)} ${round(y)}`)
  }

  // Close along the bottom so the fill sits below the tear.
  commands.push(`L100 ${height}`, `L0 ${height}`, 'Z')
  return commands.join(' ')
}

/**
 * The torn edge as an OPEN SVG path — only the curvy part, no straight
 * bottom closure. Used for stroking the outline without drawing a straight
 * line along the bottom of the strip.
 */
export function tornEdgeSvgCurvePath({
  seed,
  segments = 64,
  amplitude = 3.2,
  height = 10,
}: {
  seed: string
  segments?: number
  amplitude?: number
  height?: number
}): string {
  const profile = makeTearProfile(hashSeed(seed))
  const mid = height / 2
  const commands: string[] = []

  for (let i = 0; i <= segments; i++) {
    const t = i / segments
    const y = clamp(mid + profile(t) * amplitude, 0, height)
    commands.push(`${i === 0 ? 'M' : 'L'}${round(t * 100)} ${round(y)}`)
  }

  // NO closure — the path stays open so only the curvy edge is stroked.
  return commands.join(' ')
}

