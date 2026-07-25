import type { ElementType, ReactNode } from 'react'

import type { Branch } from '@/lib/branch'
import { cn } from '@/lib/utils'

/**
 * Applies a branch treatment to everything inside it (CLAUDE.md §7.3).
 *
 * This is the mechanism that lets the tech and non-tech halves look different
 * without duplicating components. It sets `data-branch`, which remaps the
 * `--branch-*` variables in `theme.css`; children then use the `branch-*`
 * utilities (`bg-branch-ground`, `text-branch-text`, `font-branch-label`) and
 * follow along. shadcn primitives adapt too, because the shadcn semantic
 * tokens are mapped onto the same variables.
 *
 * So a card, a button and a heading each get written once and render as ink +
 * signal + mono labels on the tech side, and sage + gold + humanist sans on
 * the non-tech side.
 */
export type BranchThemeProps = {
  branch: Branch
  children: ReactNode
  className?: string
  as?: ElementType
  /** Paints the branch ground and default text colour. */
  paint?: boolean
}

export function BranchTheme({
  branch,
  children,
  className,
  as: Component = 'div',
  paint = true,
}: BranchThemeProps) {
  return (
    <Component
      data-branch={branch}
      className={cn(
        paint && 'bg-branch-ground text-branch-text font-branch',
        className,
      )}
    >
      {children}
    </Component>
  )
}
