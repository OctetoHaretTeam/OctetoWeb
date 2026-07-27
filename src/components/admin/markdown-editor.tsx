import { useLayoutEffect, useMemo, useRef, useState } from 'react'
import { Eye, Pencil } from 'lucide-react'

import {
  MARKDOWN_ACTIONS,
  MarkdownToolbar,
  type ToolbarAction,
} from '@/components/admin/markdown-toolbar'
import { Textarea } from '@/components/ui/textarea'
import { createMarkdownRenderer } from '@/lib/markdown'
import type { Selection } from '@/lib/markdown-commands'
import { cn } from '@/lib/utils'

/** Keyboard shortcuts, by the action id they trigger. */
const SHORTCUTS: Record<string, string> = { b: 'bold', i: 'italic', k: 'link' }

/**
 * One markdown body field: formatting bar, textarea, and live preview —
 * CLAUDE.md §10.
 *
 * The preview renders through the same configuration the published page uses
 * (`@/lib/markdown`), so what the writer sees is what the article will be.
 * That module carries `html: false`, which is why the rendered string is safe
 * to inject here.
 */
export function MarkdownEditor({
  id,
  value,
  onChange,
  rows = 14,
  lang,
  required = false,
  invalid = false,
  describedBy,
}: {
  id: string
  value: string
  onChange: (value: string) => void
  rows?: number
  lang?: string
  required?: boolean
  invalid?: boolean
  describedBy?: string
}) {
  const [preview, setPreview] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  /*
   * Where the caret must land once React has committed the new text. A command
   * computes the selection from the string, but the textarea only exists after
   * the render, so it is applied in the layout effect below.
   */
  const pendingSelection = useRef<Selection | null>(null)

  const renderer = useMemo(() => createMarkdownRenderer(), [])
  const html = useMemo(
    () => (preview ? renderer.render(value) : ''),
    [preview, renderer, value],
  )

  useLayoutEffect(() => {
    const node = textareaRef.current
    const next = pendingSelection.current
    if (!node || !next) return

    pendingSelection.current = null
    node.focus()
    node.setSelectionRange(next.start, next.end)
  }, [value])

  function runAction(action: ToolbarAction) {
    const node = textareaRef.current
    if (!node) return

    const result = action.apply(value, {
      start: node.selectionStart,
      end: node.selectionEnd,
    })
    pendingSelection.current = result.selection
    onChange(result.text)
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (!event.ctrlKey && !event.metaKey) return

    const actionId = SHORTCUTS[event.key.toLowerCase()]
    if (!actionId) return

    const action = MARKDOWN_ACTIONS.find((candidate) => candidate.id === actionId)
    if (!action) return

    event.preventDefault()
    runAction(action)
  }

  return (
    <div className="border-input overflow-hidden rounded-md border">
      <div className="border-input bg-muted/40 flex flex-wrap items-center gap-2 border-b px-1.5 py-1">
        <MarkdownToolbar onAction={runAction} disabled={preview} />

        <button
          type="button"
          onClick={() => setPreview((current) => !current)}
          aria-pressed={preview}
          className="text-muted-foreground hover:bg-accent hover:text-foreground ml-auto inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs transition-colors"
        >
          {preview ? (
            <Pencil aria-hidden="true" className="h-3.5 w-3.5" />
          ) : (
            <Eye aria-hidden="true" className="h-3.5 w-3.5" />
          )}
          {preview ? 'Editează' : 'Previzualizare'}
        </button>
      </div>

      {preview ? (
        /*
         * Matches the textarea's height so toggling does not resize the form
         * under the writer's cursor (§12: zero layout shift).
         */
        <div
          className="prose-body max-w-none overflow-y-auto px-3 py-2 text-sm"
          style={{ minHeight: `${rows * 1.5}rem` }}
        >
          {value.trim() ? (
            <div dangerouslySetInnerHTML={{ __html: html }} />
          ) : (
            <p className="text-muted-foreground">
              Nimic de previzualizat încă. Scrie textul în fila de editare.
            </p>
          )}
        </div>
      ) : (
        <Textarea
          ref={textareaRef}
          id={id}
          lang={lang}
          rows={rows}
          value={value}
          required={required}
          aria-invalid={invalid ? true : undefined}
          aria-describedby={describedBy}
          onChange={(event) => onChange(event.target.value)}
          onKeyDown={handleKeyDown}
          className={cn(
            'rounded-none border-0 focus-visible:ring-0',
            'font-mono text-sm',
          )}
        />
      )}
    </div>
  )
}
