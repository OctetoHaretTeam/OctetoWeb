import { useId, useMemo } from 'react'
import type { ReactNode } from 'react'

import { cn } from '@/lib/utils'

/**
 * PaperCutout — the site's signature element (CLAUDE.md §7.4).
 *
 * A torn cream-paper shape with the content clipped inside it, leaving an
 * irregular paper border. The edge is generated from a `seed` string (the
 * member slug), so every member's tear is different but stable across renders
 * and between server and client.
 *
 * Used on team cards, member profiles and non-tech entry covers. Nowhere else —
 * if it appears on every surface it stops being a signature (§7.4).
 */

/** FNV-1a. Small, fast, and stable across platforms — no crypto needed here. */
function hashSeed(seed: string): number {
  let h = 0x811c9dc5
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i)
    h = Math.imul(h, 0x01000193)
  }
  return h >>> 0
}

/** mulberry32 — deterministic PRNG from a 32-bit seed. */
function mulberry32(seed: number): () => number {
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
 * signal that drifts instead of jumping, which is what stops the edge reading
 * as a zigzag. The ring wraps, so the path closes without a seam.
 */
function makeNoise(rand: () => number, steps: number): (t: number) => number {
  const points = Array.from({ length: steps }, () => rand() * 2 - 1)
  return (t: number) => {
    const x = ((t % 1) + 1) % 1 * steps
    const i = Math.floor(x) % steps
    const j = (i + 1) % steps
    const f = x - Math.floor(x)
    const s = f * f * (3 - 2 * f) // smoothstep
    return points[i]! * (1 - s) + points[j]! * s
  }
}

type Point = { x: number; y: number }

/**
 * Maps a perimeter position to a point on the unit square, with the outward
 * normal at that point.
 */
function perimeter(t: number): { point: Point; normal: Point } {
  const u = ((t % 1) + 1) % 1
  if (u < 0.25) {
    const k = u * 4
    return { point: { x: k, y: 0 }, normal: { x: 0, y: -1 } }
  }
  if (u < 0.5) {
    const k = (u - 0.25) * 4
    return { point: { x: 1, y: k }, normal: { x: 1, y: 0 } }
  }
  if (u < 0.75) {
    const k = (u - 0.5) * 4
    return { point: { x: 1 - k, y: 1 }, normal: { x: 0, y: 1 } }
  }
  const k = (u - 0.75) * 4
  return { point: { x: 0, y: 1 - k }, normal: { x: -1, y: 0 } }
}

type TornOptions = {
  /** Pushes the whole edge inward. 0 is the full box. */
  inset: number
  /** Peak displacement of the tear, in bounding-box units. */
  amplitude: number
  /** Vertices around the perimeter. More gives finer fibre. */
  segments: number
  /** Offsets the noise ring so two paths from one seed differ. */
  phase: number
}

/**
 * Builds a torn edge as an SVG path in 0..1 coordinates, usable both as a
 * `clipPath` with `clipPathUnits="objectBoundingBox"` and as a `<path>` inside
 * a `viewBox="0 0 1 1"`.
 *
 * Three frequencies are layered: a slow drift that makes one side of the sheet
 * differ from another, a mid band that forms the actual tear, and a fine
 * tremor for fibre. Straight lines between vertices keep it papery — a smooth
 * curve reads as a blob, not a tear.
 */
function tornPath(seed: number, options: TornOptions): string {
  const { inset, amplitude, segments, phase } = options
  const rand = mulberry32(seed)
  const drift = makeNoise(rand, 5)
  const tear = makeNoise(rand, 17)
  const fibre = makeNoise(rand, 53)

  const commands: string[] = []
  for (let i = 0; i < segments; i++) {
    const t = i / segments
    const n = t + phase
    // Weighted so the mid band dominates; fibre only breaks up the silhouette.
    const displacement =
      drift(n * 0.5) * 0.45 + tear(n) * 0.4 + fibre(n) * 0.15

    const { point, normal } = perimeter(t)
    // Bias inward: the shape must stay inside its box or the tear gets clipped.
    const offset = inset + amplitude * (displacement * 0.5 - 0.5)
    const x = clamp01(point.x - normal.x * offset)
    const y = clamp01(point.y - normal.y * offset)
    commands.push(`${i === 0 ? 'M' : 'L'}${round(x)} ${round(y)}`)
  }
  commands.push('Z')
  return commands.join('')
}

const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v)
const round = (v: number) => Math.round(v * 10000) / 10000

export type PaperCutoutProps = {
  /** Stable string — use the member slug so the tear never changes. */
  seed: string
  children?: ReactNode
  className?: string
  /** Width of the visible paper border, in bounding-box units. */
  edge?: number
  /** Scales the tear. 0 is a clean rectangle. */
  roughness?: number
  /** Colour of the paper sheet. */
  tone?: string
  /**
   * Adds a soft shadow under the torn edge, so the sheet reads as lifted off
   * the ground rather than printed on it.
   */
  lifted?: boolean
}

export function PaperCutout({
  seed,
  children,
  className,
  edge = 0.05,
  roughness = 1,
  tone = 'var(--color-paper)',
  lifted = true,
}: PaperCutoutProps) {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, '')
  const contentId = `cutout-content-${uid}`
  const shadowId = `cutout-shadow-${uid}`

  const { sheetPath, contentPath } = useMemo(() => {
    const base = hashSeed(seed)
    const amplitude = 0.035 * roughness
    return {
      sheetPath: tornPath(base, {
        inset: amplitude,
        amplitude,
        segments: 132,
        phase: 0,
      }),
      // Same seed, shifted phase: the inner tear is related to the outer one
      // without tracing it, which is what makes the border look uneven.
      contentPath: tornPath(base, {
        inset: amplitude + edge,
        amplitude: amplitude * 0.85,
        segments: 132,
        phase: 0.37,
      }),
    }
  }, [seed, edge, roughness])

  return (
    <div className={cn('relative isolate', className)}>
      <svg
        viewBox="0 0 1 1"
        preserveAspectRatio="none"
        aria-hidden="true"
        focusable="false"
        className="absolute inset-0 -z-10 h-full w-full"
      >
        <defs>
          <clipPath id={contentId} clipPathUnits="objectBoundingBox">
            <path d={contentPath} />
          </clipPath>
          {lifted ? (
            <filter
              id={shadowId}
              x="-20%"
              y="-20%"
              width="140%"
              height="140%"
              colorInterpolationFilters="sRGB"
            >
              <feDropShadow
                dx="0"
                dy="0.012"
                stdDeviation="0.014"
                floodColor="var(--color-ink)"
                floodOpacity="0.35"
              />
            </filter>
          ) : null}
        </defs>
        <path
          d={sheetPath}
          fill={tone}
          filter={lifted ? `url(#${shadowId})` : undefined}
        />
      </svg>

      <div
        className="h-full w-full"
        style={{ clipPath: `url(#${contentId})` }}
      >
        {children}
      </div>
    </div>
  )
}
