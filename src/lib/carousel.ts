/**
 * Pure index arithmetic for the hero slideshow — CLAUDE.md §4.
 *
 * Kept separate from the React component so the wraparound is unit-testable
 * without a DOM, matching the split already used for the markdown toolbar
 * (`markdown-commands.ts` vs `markdown-editor.tsx`).
 */
export function nextSlideIndex(current: number, count: number): number {
  if (count <= 0) return 0
  return (current + 1) % count
}

export function prevSlideIndex(current: number, count: number): number {
  if (count <= 0) return 0
  return (((current - 1) % count) + count) % count
}

export function slideIndexFromScroll(
  scrollLeft: number,
  slideWidth: number,
  count: number,
): number {
  if (count <= 1 || slideWidth <= 0) return 0
  const raw = Math.round(scrollLeft / slideWidth)
  if (raw <= 0) return 0
  return Math.min(count - 1, raw)
}
