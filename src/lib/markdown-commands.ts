/**
 * Text transforms behind the markdown toolbar — CLAUDE.md §10.
 *
 * Pure functions on (text, selection): no DOM, no React. The editor component
 * owns the textarea and the caret; this file owns what the markdown should
 * become. Keeping them apart is what makes the toolbar's behaviour checkable
 * without rendering anything.
 */

export type Selection = {
  /** Caret start, as `textarea.selectionStart`. */
  start: number
  /** Caret end, as `textarea.selectionEnd`. */
  end: number
}

export type EditResult = {
  text: string
  selection: Selection
}

/**
 * Wraps the selection in `marker` on both sides, or unwraps it when the
 * selection is already wrapped.
 *
 * Toggling matters more than it looks: without it, clicking **B** twice on the
 * same word leaves `****word****`, which markdown renders as literal asterisks.
 */
export function toggleWrap(
  text: string,
  selection: Selection,
  marker: string,
  placeholder: string,
): EditResult {
  const char = marker[0] ?? ''
  const len = marker.length
  let { start, end } = selection

  /*
   * `*` and `**` share a character, so these markers cannot be matched as
   * literal strings — italic would eat one asterisk off each side of a bold
   * word and silently downgrade it.
   *
   * What actually matters is the LENGTH of the asterisk run around the text,
   * which encodes a set: 1 is italic, 2 is bold, 3 is both. So the run is
   * measured, asked whether it already contains this marker, and rewritten.
   */

  // Markers the user happened to include in the selection belong to the run,
  // not to the text being emphasised.
  const selected = text.slice(start, end)
  let insideLeft = 0
  while (insideLeft < selected.length && selected[insideLeft] === char) {
    insideLeft += 1
  }
  let insideRight = 0
  while (
    insideRight < selected.length - insideLeft &&
    selected[selected.length - 1 - insideRight] === char
  ) {
    insideRight += 1
  }
  start += insideLeft
  end -= insideRight

  let left = 0
  while (start - left - 1 >= 0 && text[start - left - 1] === char) left += 1
  let right = 0
  while (end + right < text.length && text[end + right] === char) right += 1

  // Emphasis is symmetric; an unbalanced run is only as strong as its weaker side.
  const run = Math.min(left, right)
  const selectedCore = text.slice(start, end)

  /*
   * Whitespace has to stay OUTSIDE the markers. Double-clicking a word selects
   * its trailing space in every browser, and `**word **` is not bold — the
   * closing delimiter has to hug the text. Emitting that would hand the writer
   * asterisks that render as literal asterisks, which is the whole failure this
   * toolbar exists to prevent.
   */
  const lead = selectedCore.match(/^\s*/)?.[0] ?? ''
  const trail = selectedCore.slice(lead.length).match(/\s*$/)?.[0] ?? ''
  const trimmed = selectedCore.slice(lead.length, selectedCore.length - trail.length)
  const core = trimmed || placeholder

  const present = len === 1 ? run % 2 === 1 : run >= len
  const nextRun = Math.max(0, present ? run - len : run + len)

  const fence = char.repeat(nextRun)
  const from = start - run
  const replacement = lead + fence + core + fence + trail
  const bodyStart = from + lead.length + nextRun

  return {
    text: text.slice(0, from) + replacement + text.slice(end + run),
    // Select the body, not the markers, so typing replaces the placeholder.
    selection: { start: bodyStart, end: bodyStart + core.length },
  }
}

/**
 * Adds `prefix` to every line the selection touches, or removes it when every
 * touched line already has it.
 *
 * Works on whole lines by design — a heading or list marker is meaningless in
 * the middle of one, so the selection is grown to line boundaries first.
 */
export function toggleLinePrefix(
  text: string,
  selection: Selection,
  prefix: string,
  placeholder: string,
): EditResult {
  const lineStart = text.lastIndexOf('\n', selection.start - 1) + 1
  const lineEndIndex = text.indexOf('\n', selection.end)
  const lineEnd = lineEndIndex === -1 ? text.length : lineEndIndex

  const block = text.slice(lineStart, lineEnd) || placeholder
  const lines = block.split('\n')

  // A heading swap (## → ###) should replace the old marker, not stack onto it.
  const headingLike = /^#{1,6} /
  const isHeading = headingLike.test(prefix)
  const stripped = lines.map((line) =>
    isHeading ? line.replace(headingLike, '') : line,
  )

  const allPrefixed = lines.every((line) => line.startsWith(prefix))
  const next = allPrefixed
    ? lines.map((line) => line.slice(prefix.length))
    : stripped.map((line) => prefix + line)

  const replacement = next.join('\n')
  return {
    text: text.slice(0, lineStart) + replacement + text.slice(lineEnd),
    selection: { start: lineStart, end: lineStart + replacement.length },
  }
}

/**
 * Inserts a link. A selection becomes the link text; the caret then lands on
 * the URL, which is the part the writer still has to supply.
 */
export function insertLink(
  text: string,
  selection: Selection,
  placeholder: string,
  urlPlaceholder: string,
): EditResult {
  const { start, end } = selection
  const label = text.slice(start, end) || placeholder
  const snippet = `[${label}](${urlPlaceholder})`
  const urlStart = start + label.length + 3

  return {
    text: text.slice(0, start) + snippet + text.slice(end),
    selection: { start: urlStart, end: urlStart + urlPlaceholder.length },
  }
}

/** Inserts a standalone block (a rule, a table skeleton) on its own lines. */
export function insertBlock(
  text: string,
  selection: Selection,
  block: string,
): EditResult {
  const { start, end } = selection
  const needsLeading = start > 0 && text[start - 1] !== '\n'
  const snippet = (needsLeading ? '\n' : '') + block + '\n'
  const caret = start + snippet.length

  return {
    text: text.slice(0, start) + snippet + text.slice(end),
    selection: { start: caret, end: caret },
  }
}
