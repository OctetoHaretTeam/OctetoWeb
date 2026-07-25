/**
 * WCAG 2.1 contrast maths — CLAUDE.md §7.7.
 *
 * The styleguide computes every ratio it displays with these functions rather
 * than quoting numbers from a comment, so when the real hexes arrive from the
 * logo SVG (§15.1) the table re-checks itself instead of going quietly stale.
 */

export type Rgb = { r: number; g: number; b: number }

export function parseHex(hex: string): Rgb {
  const value = hex.trim().replace(/^#/, '')
  const full =
    value.length === 3
      ? value
          .split('')
          .map((c) => c + c)
          .join('')
      : value

  if (!/^[0-9a-fA-F]{6}$/.test(full)) {
    throw new Error(`Not a hex colour: ${hex}`)
  }

  const n = Number.parseInt(full, 16)
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 }
}

/** WCAG relative luminance. */
export function relativeLuminance(hex: string): number {
  const { r, g, b } = parseHex(hex)
  const [rl, gl, bl] = [r, g, b].map((channel) => {
    const c = channel / 255
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
  }) as [number, number, number]
  return 0.2126 * rl + 0.7152 * gl + 0.0722 * bl
}

/** Contrast ratio between two colours, from 1 to 21. Order does not matter. */
export function contrastRatio(a: string, b: string): number {
  const [lighter, darker] = [relativeLuminance(a), relativeLuminance(b)].sort(
    (x, y) => y - x,
  ) as [number, number]
  return (lighter + 0.05) / (darker + 0.05)
}

export type ContrastUse = 'text' | 'large-text' | 'ui'

/** Minimum ratio each use needs to clear AA. */
export const AA_THRESHOLD: Record<ContrastUse, number> = {
  text: 4.5,
  'large-text': 3,
  ui: 3,
}

export function passesAA(ratio: number, use: ContrastUse = 'text'): boolean {
  return ratio >= AA_THRESHOLD[use]
}

export function passesAAA(ratio: number, use: ContrastUse = 'text'): boolean {
  return ratio >= (use === 'text' ? 7 : 4.5)
}

/** Formats as it is conventionally written, e.g. "5.33:1". */
export function formatRatio(ratio: number): string {
  return `${ratio.toFixed(2)}:1`
}
