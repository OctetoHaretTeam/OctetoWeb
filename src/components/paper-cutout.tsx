import { useId, useMemo } from 'react'
import type { ReactNode } from 'react'

import { hashSeed, tornOutlinePath } from '@/lib/torn-edge'
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
      sheetPath: tornOutlinePath({
        seed: base,
        inset: amplitude,
        amplitude,
      }),
      // Same seed, shifted phase: the inner tear is related to the outer one
      // without tracing it, which is what makes the border look uneven.
      contentPath: tornOutlinePath({
        seed: base,
        inset: amplitude + edge,
        amplitude: amplitude * 0.85,
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
