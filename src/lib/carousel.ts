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
