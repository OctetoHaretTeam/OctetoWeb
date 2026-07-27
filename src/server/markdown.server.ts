import { createMarkdownRenderer } from '@/lib/markdown'

/**
 * Markdown rendering for `body` fields — CLAUDE.md §5.
 *
 * `.server.ts` on purpose. Rendering happens inside server functions and the
 * HTML travels to the browser already built, so markdown-it never reaches the
 * client bundle on a public route — which matters, because §12's budget is
 * already tight.
 *
 * The configuration itself lives in `@/lib/markdown` so the admin's live
 * preview renders through exactly the same rules, including `html: false`.
 */
const renderer = createMarkdownRenderer()

export function renderMarkdown(source: string): string {
  return renderer.render(source)
}

/** Single-paragraph render, for excerpts and captions. */
export function renderMarkdownInline(source: string): string {
  return renderer.renderInline(source)
}
