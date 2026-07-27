import { describe, expect, test } from 'bun:test'

import {
  insertBlock,
  insertLink,
  toggleLinePrefix,
  toggleWrap,
} from './markdown-commands'

/**
 * The toolbar exists so someone who does not write markdown can still write a
 * post. That only holds if pressing a button twice undoes it and if the caret
 * lands somewhere useful afterwards — these pin both.
 */

describe('toggleWrap', () => {
  test('wraps the selection and selects the body, not the markers', () => {
    const result = toggleWrap('salut lume', { start: 6, end: 10 }, '**', 'x')
    expect(result.text).toBe('salut **lume**')
    expect(result.text.slice(result.selection.start, result.selection.end)).toBe(
      'lume',
    )
  })

  test('unwraps when the markers are inside the selection', () => {
    const result = toggleWrap('salut **lume**', { start: 6, end: 14 }, '**', 'x')
    expect(result.text).toBe('salut lume')
  })

  test('unwraps when the markers sit just outside the selection', () => {
    // The common case: double-click a word, press B, press B again.
    const result = toggleWrap('salut **lume**', { start: 8, end: 12 }, '**', 'x')
    expect(result.text).toBe('salut lume')
    expect(result.text.slice(result.selection.start, result.selection.end)).toBe(
      'lume',
    )
  })

  test('trailing whitespace stays outside the markers', () => {
    // Double-clicking a word selects its trailing space in every browser, and
    // `**normal **` is not bold — CommonMark requires the closing delimiter to
    // hug the text.
    const result = toggleWrap('Text normal cu', { start: 5, end: 12 }, '**', 'x')
    expect(result.text).toBe('Text **normal** cu')
    expect(result.text.slice(result.selection.start, result.selection.end)).toBe(
      'normal',
    )
  })

  test('leading whitespace stays outside the markers too', () => {
    const result = toggleWrap('Text normal', { start: 4, end: 11 }, '**', 'x')
    expect(result.text).toBe('Text **normal**')
  })

  test('a whitespace-only selection keeps the space and inserts a placeholder', () => {
    // Selecting only a space and pressing B is a nonsense action; what matters
    // is that the space survives and the writer gets something to type over.
    const result = toggleWrap('a b', { start: 1, end: 2 }, '**', 'gras')
    expect(result.text).toBe('a **gras**b')
    expect(result.text.slice(result.selection.start, result.selection.end)).toBe(
      'gras',
    )
  })

  test('an empty selection inserts a placeholder and selects it', () => {
    const result = toggleWrap('', { start: 0, end: 0 }, '*', 'text cursiv')
    expect(result.text).toBe('*text cursiv*')
    expect(result.text.slice(result.selection.start, result.selection.end)).toBe(
      'text cursiv',
    )
  })

  test('italic nests inside bold instead of eating its asterisks', () => {
    // `*` and `**` share a character. Naively matching one asterisk on each
    // side would strip the bold down to italic and lose formatting the writer
    // never touched.
    const result = toggleWrap('**lume**', { start: 2, end: 6 }, '*', 'x')
    expect(result.text).toBe('***lume***')
  })

  test('bold still unwraps cleanly from a bold-and-italic run', () => {
    const result = toggleWrap('***lume***', { start: 3, end: 7 }, '*', 'x')
    expect(result.text).toBe('**lume**')
  })
})

describe('toggleLinePrefix', () => {
  test('prefixes every line the selection touches', () => {
    const result = toggleLinePrefix('unu\ndoi', { start: 1, end: 5 }, '- ', 'x')
    expect(result.text).toBe('- unu\n- doi')
  })

  test('removes the prefix when every line already has it', () => {
    const result = toggleLinePrefix(
      '- unu\n- doi',
      { start: 0, end: 11 },
      '- ',
      'x',
    )
    expect(result.text).toBe('unu\ndoi')
  })

  test('swapping heading level replaces the marker instead of stacking it', () => {
    const result = toggleLinePrefix('## Titlu', { start: 0, end: 0 }, '### ', 'x')
    expect(result.text).toBe('### Titlu')
  })

  test('acts on the whole line even from a caret mid-word', () => {
    const result = toggleLinePrefix('Titlu', { start: 3, end: 3 }, '## ', 'x')
    expect(result.text).toBe('## Titlu')
  })

  test('an empty document gets the placeholder', () => {
    const result = toggleLinePrefix('', { start: 0, end: 0 }, '## ', 'Titlu')
    expect(result.text).toBe('## Titlu')
  })
})

describe('insertLink', () => {
  test('keeps the selection as the label and selects the URL', () => {
    const result = insertLink('vezi echipa', { start: 5, end: 11 }, 'text', 'https://')
    expect(result.text).toBe('vezi [echipa](https://)')
    // The caret must land on the URL — it is the part still to be filled in.
    expect(result.text.slice(result.selection.start, result.selection.end)).toBe(
      'https://',
    )
  })

  test('with no selection it inserts a labelled placeholder', () => {
    const result = insertLink('', { start: 0, end: 0 }, 'text link', 'https://')
    expect(result.text).toBe('[text link](https://)')
  })
})

describe('insertBlock', () => {
  test('starts a new line when the caret is mid-line', () => {
    const result = insertBlock('text', { start: 4, end: 4 }, '---')
    expect(result.text).toBe('text\n---\n')
  })

  test('does not add a leading newline at the start of the document', () => {
    expect(insertBlock('', { start: 0, end: 0 }, '---').text).toBe('---\n')
  })
})
