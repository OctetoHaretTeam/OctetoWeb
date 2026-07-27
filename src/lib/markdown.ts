import MarkdownIt from 'markdown-it'

/**
 * The one markdown configuration this site renders with.
 *
 * Extracted so the admin's live preview (CLAUDE.md §10) and the published page
 * share it. A preview built on a second, slightly different renderer is worse
 * than no preview — it tells the writer their post looks like something it
 * won't.
 *
 * **`html: false` is the security boundary.** With raw HTML disabled,
 * markdown-it escapes any `<script>` or `<img onerror>` in the source instead
 * of passing it through, so there is no XSS vector and no sanitiser to keep
 * correct. Admin accounts are allowlisted, but an allowlisted account can
 * still be compromised, and this makes that class of bug impossible rather
 * than unlikely. It is also what lets the preview render with
 * `dangerouslySetInnerHTML` safely.
 *
 * Importing this module pulls markdown-it into whatever bundle imports it.
 * Server rendering goes through `markdown.server.ts`; the only client importer
 * is the admin editor, which is code-split away from every public route (§12).
 */
export function createMarkdownRenderer(): MarkdownIt {
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

  return renderer
}
