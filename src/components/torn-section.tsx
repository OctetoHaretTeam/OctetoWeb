import { useMemo } from 'react'
import type { ElementType, ReactNode } from 'react'

import { BranchTheme } from '@/components/branch-theme'
import type { Branch } from '@/lib/branch'
import { tornEdgeSvgPath, tornEdgeSvgCurvePath } from '@/lib/torn-edge'
import { cn } from '@/lib/utils'

/**
 * A page section that lies over the one above it along a torn edge —
 * CLAUDE.md §7.1.
 *
 * This is what separates news from performance from sponsors: each section is
 * a sheet of paper, and the tear is where one sheet ends. A flat colour change
 * alone was not reading as a boundary.
 *
 * The tear is a fixed-height strip rather than a `clip-path` on the section
 * itself. A percentage polygon scales with the element, so the same tear would
 * be a few pixels deep on a short section and enormous on a long one; a strip
 * keeps every tear on the page the same weight.
 *
 * Each section passes its own `seed`, so no two tears on a page are identical
 * — the thing that stops it looking like a repeated graphic.
 */
export function TornSection({
  branch,
  seed,
  children,
  className,
  as = 'section',
  /** The first section on a page has nothing to tear over. */
  torn = true,
  /**
   * Strokes the torn edge so it reads even when the section above shares this
   * section's ground colour. Costs no vertical space, unlike a rule.
   */
  outlined = false,
}: {
  branch: Branch
  seed: string
  children: ReactNode
  className?: string
  as?: ElementType
  torn?: boolean
  outlined?: boolean
}) {
  const fillPath = useMemo(
    () => tornEdgeSvgPath({ seed, amplitude: 3.8, segments: 76 }),
    [seed],
  )
  const curvePath = useMemo(
    () => tornEdgeSvgCurvePath({ seed, amplitude: 3.8, segments: 76 }),
    [seed],
  )

  return (
    <BranchTheme
      branch={branch}
      as={as}
      className={cn('relative', torn && '-mt-px', className)}
    >
      {torn ? (
        <svg
          viewBox="0 0 100 10"
          preserveAspectRatio="none"
          aria-hidden="true"
          focusable="false"
          /* Sits above the previous section and is painted in this section's
             own ground colour, so the sheet reads as lying on top of it. */
          className="pointer-events-none absolute inset-x-0 -top-[var(--tear)] z-10 h-[var(--tear)] w-full [--tear:2.1rem] drop-shadow-[0_-3px_3px_rgba(10,12,9,0.28)]"
        >
          {/* The fill covers the whole shape so the section's ground colour
              paints behind the tear. */}
          <path d={fillPath} fill="var(--branch-ground)" />

          {/* Subtle hand-drawn stitch / ink line along the curvy torn edge */}
          {curvePath ? (
            <path
              d={curvePath}
              fill="none"
              stroke={outlined ? 'var(--branch-muted)' : 'var(--color-ink)'}
              strokeOpacity={outlined ? 0.75 : 0.45}
              strokeWidth={outlined ? 1.5 : 1.2}
              strokeDasharray={outlined ? '4 3' : undefined}
              vectorEffect="non-scaling-stroke"
            />
          ) : null}
        </svg>
      ) : null}

      {children}
    </BranchTheme>
  )
}

