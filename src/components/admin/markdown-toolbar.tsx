import {
  Bold,
  Code,
  Heading2,
  Heading3,
  Italic,
  Link2,
  List,
  ListOrdered,
  Minus,
  Quote,
} from 'lucide-react'

import {
  insertBlock,
  insertLink,
  toggleLinePrefix,
  toggleWrap,
  type EditResult,
  type Selection,
} from '@/lib/markdown-commands'
import { cn } from '@/lib/utils'

/**
 * The formatting bar above a markdown body field — CLAUDE.md §10.
 *
 * Romanian-only, like the rest of admin (§11). Every action is a real
 * `<button>` so the bar is keyboard-navigable and screen-reader-announced
 * (§7.7), and each one is a pure transform from `markdown-commands`.
 */

export type ToolbarAction = {
  id: string
  /** Romanian label, announced and shown on hover. */
  label: string
  icon: typeof Bold
  /** Keyboard hint appended to the tooltip, e.g. `Ctrl+B`. */
  shortcut?: string
  apply: (text: string, selection: Selection) => EditResult
}

export const MARKDOWN_ACTIONS: ToolbarAction[] = [
  {
    id: 'bold',
    label: 'Îngroșat',
    icon: Bold,
    shortcut: 'Ctrl+B',
    apply: (text, sel) => toggleWrap(text, sel, '**', 'text îngroșat'),
  },
  {
    id: 'italic',
    label: 'Cursiv',
    icon: Italic,
    shortcut: 'Ctrl+I',
    apply: (text, sel) => toggleWrap(text, sel, '*', 'text cursiv'),
  },
  {
    id: 'h2',
    label: 'Titlu mare',
    icon: Heading2,
    apply: (text, sel) => toggleLinePrefix(text, sel, '## ', 'Titlu'),
  },
  {
    id: 'h3',
    label: 'Titlu mic',
    icon: Heading3,
    apply: (text, sel) => toggleLinePrefix(text, sel, '### ', 'Subtitlu'),
  },
  {
    id: 'link',
    label: 'Link',
    icon: Link2,
    shortcut: 'Ctrl+K',
    apply: (text, sel) => insertLink(text, sel, 'text link', 'https://'),
  },
  {
    id: 'ul',
    label: 'Listă cu puncte',
    icon: List,
    apply: (text, sel) => toggleLinePrefix(text, sel, '- ', 'Element'),
  },
  {
    id: 'ol',
    label: 'Listă numerotată',
    icon: ListOrdered,
    apply: (text, sel) => toggleLinePrefix(text, sel, '1. ', 'Element'),
  },
  {
    id: 'quote',
    label: 'Citat',
    icon: Quote,
    apply: (text, sel) => toggleLinePrefix(text, sel, '> ', 'Citat'),
  },
  {
    id: 'code',
    label: 'Cod',
    icon: Code,
    apply: (text, sel) => toggleWrap(text, sel, '`', 'cod'),
  },
  {
    id: 'hr',
    label: 'Linie de separare',
    icon: Minus,
    apply: (text, sel) => insertBlock(text, sel, '---'),
  },
]

export function MarkdownToolbar({
  onAction,
  disabled = false,
  className,
}: {
  onAction: (action: ToolbarAction) => void
  disabled?: boolean
  className?: string
}) {
  return (
    <div
      role="toolbar"
      aria-label="Formatare text"
      aria-orientation="horizontal"
      className={cn('flex flex-wrap items-center gap-0.5', className)}
    >
      {MARKDOWN_ACTIONS.map((action) => {
        const Icon = action.icon
        const hint = action.shortcut
          ? `${action.label} (${action.shortcut})`
          : action.label

        return (
          <button
            key={action.id}
            type="button"
            disabled={disabled}
            title={hint}
            aria-label={hint}
            /*
             * `onMouseDown` + preventDefault, not `onClick`: the click would
             * blur the textarea first and the browser would drop the caret,
             * so the command would have no selection left to act on.
             */
            onMouseDown={(event) => {
              event.preventDefault()
              onAction(action)
            }}
            className="text-muted-foreground hover:bg-accent hover:text-foreground disabled:pointer-events-none disabled:opacity-50 inline-flex h-8 w-8 items-center justify-center rounded-md transition-colors"
          >
            <Icon aria-hidden="true" className="h-4 w-4" />
          </button>
        )
      })}
    </div>
  )
}
