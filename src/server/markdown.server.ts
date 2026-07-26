import MarkdownIt from 'markdown-it'

/**
 * Markdown rendering for `body` fields — CLAUDE.md §5.
 *
 * `.server.ts` on purpose. Rendering happens inside server functions and the
 * HTML travels to the browser already built, so markdown-it never reaches the
 * client bundle — which matters, because §12's budget is already tight.
 *
 * **`html: false` is the security boundary.** With raw HTML disabled,
 * markdown-it escapes any `<script>` or `<img onerror>` in the source instead
 * of passing it through, so there is no XSS vector and no sanitiser to keep
 * correct. Admin accounts are allowlisted, but an allowlisted account can
 * still be compromised, and this makes that class of bug impossible rather
 * than unlikely.
 */
const renderer = new MarkdownIt({
  html: false,
  linkify: true,
  typographer: true,
  breaks: false,
})

/**
 * Outbound links open in a new tab and disclaim the referrer. `noopener` is
 * the load-bearing part: without it the opened page can reach back through
 * `window.opener`.
 */
const defaultLinkOpen =
  renderer.renderer.rules.link_open ??
  ((tokens, idx, options, _env, self) => self.renderToken(tokens, idx, options))

renderer.renderer.rules.link_open = (tokens, idx, options, env, self) => {
  const href = tokens[idx]?.attrGet('href') ?? ''

  if (/^https?:\/\//.test(href)) {
    tokens[idx]?.attrSet('target', '_blank')
    tokens[idx]?.attrSet('rel', 'noopener noreferrer')
  }

  return defaultLinkOpen(tokens, idx, options, env, self)
}

export function renderMarkdown(source: string): string {
  return renderer.render(source)
}

/** Single-paragraph render, for excerpts and captions. */
export function renderMarkdownInline(source: string): string {
  return renderer.renderInline(source)
}
