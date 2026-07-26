import type { Branch } from './branch'

/**
 * The brand palette, mirrored from `src/styles/theme.css` for the styleguide.
 *
 * `theme.css` remains the single source of truth (CLAUDE.md §7.2) — these
 * values exist only so the contrast table can be computed during SSR, without
 * waiting for the browser to resolve custom properties. `palette.test.ts`
 * parses `theme.css` and fails if the two ever drift.
 */

export const BRAND_PALETTE = {
  ink: '#0a0c09',
  carbon: '#141811',
  slate: '#232a20',
  sage: '#7c8a6b',
  paper: '#e9e4d6',
  signal: '#afd46a',
  gold: '#efb428',
  violet: '#e0aad6',
} as const

export type BrandToken = keyof typeof BRAND_PALETTE

export const PALETTE_ROLES: Record<BrandToken, string> = {
  ink: 'Fundal de bază',
  carbon: 'Suprafață ridicată',
  slate: 'Chenare, separatoare',
  sage: 'Pânză non-tehnică',
  paper: 'Decupaje, carduri, text pe fundal închis',
  signal: 'Doar interactiv',
  gold: 'Doar realizări',
  violet: 'Doar logo',
}

/** Colours used as a page or panel ground, which is what text sits on. */
export const GROUND_TOKENS: BrandToken[] = [
  'ink',
  'carbon',
  'slate',
  'sage',
  'paper',
]

/** The treatments in CLAUDE.md §7.3, as data so the styleguide can show both. */
export const BRANCH_TREATMENTS: Record<
  Branch,
  {
    label: string
    ground: BrandToken
    surface: BrandToken
    text: BrandToken
    muted: BrandToken
    accent: BrandToken
    accentText: BrandToken
    type: string
  }
> = {
  tech: {
    label: 'Tehnic',
    ground: 'ink',
    surface: 'carbon',
    text: 'paper',
    muted: 'sage',
    accent: 'signal',
    accentText: 'signal',
    type: 'Mono pentru etichete și specificații',
  },
  non_tech: {
    label: 'Non-tehnic',
    ground: 'sage',
    surface: 'paper',
    text: 'ink',
    muted: 'carbon',
    accent: 'gold',
    // Not gold: gold on sage measures 1.97:1.
    accentText: 'ink',
    type: 'Sans humanist peste tot',
  },
}
