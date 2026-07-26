import { describe, expect, test } from 'bun:test'

import { renderMarkdown } from './markdown.server'

/**
 * Body text is written by allowlisted administrators, but an allowlisted
 * account can be compromised. Raw HTML is disabled so injection is impossible
 * rather than merely unlikely — these tests pin that.
 */
describe('raw HTML is escaped, never passed through', () => {
  test('a script tag', () => {
    const html = renderMarkdown('<script>alert(1)</script>')
    expect(html).not.toContain('<script>')
    expect(html).toContain('&lt;script&gt;')
  })

  test('an event handler on an image', () => {
    const html = renderMarkdown('<img src=x onerror="alert(1)">')
    // The whole tag is escaped, so `onerror=` survives only as visible text —
    // what matters is that no real <img element is emitted.
    expect(html).not.toMatch(/<img/i)
    expect(html).toContain('&lt;img')
  })

  test('an iframe', () => {
    expect(renderMarkdown('<iframe src="evil"></iframe>')).not.toContain(
      '<iframe',
    )
  })

  test('a javascript: link is not rendered as an href', () => {
    const html = renderMarkdown('[click](javascript:alert(1))')
    expect(html).not.toContain('href="javascript:')
  })
})

describe('normal markdown still renders', () => {
  test('headings, emphasis and lists', () => {
    const html = renderMarkdown('# Titlu\n\nText **gras**.\n\n- unu\n- doi')
    expect(html).toContain('<h1>')
    expect(html).toContain('<strong>')
    expect(html).toContain('<li>')
  })

  test('Romanian diacritics survive intact', () => {
    expect(renderMarkdown('Chișinău, ăâîșț')).toContain('Chișinău, ăâîșț')
  })
})

describe('outbound links are hardened', () => {
  test('external links open in a new tab without window.opener', () => {
    const html = renderMarkdown('[FIRST](https://firstinspires.org)')
    expect(html).toContain('target="_blank"')
    // Without noopener the opened page can navigate ours.
    expect(html).toContain('noopener')
  })

  test('internal links are left alone', () => {
    const html = renderMarkdown('[echipa](/ro/team)')
    expect(html).not.toContain('target="_blank"')
  })
})
