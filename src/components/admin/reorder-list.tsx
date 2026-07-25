import { useState } from 'react'
import { ChevronDown, ChevronUp, GripVertical } from 'lucide-react'

import { cn } from '@/lib/utils'

/**
 * Drag-to-reorder for `displayOrder` — CLAUDE.md §10.
 *
 * Drag is the fast path, but it is NOT the only one: §7.7 requires full
 * keyboard navigation including the admin panel, and dragging is unreachable
 * by keyboard. Every row therefore also has move-up and move-down buttons,
 * which are the accessible mechanism rather than a fallback.
 *
 * Reordering is applied optimistically and announced to assistive technology,
 * because a silent list that rearranges itself is unusable without sight.
 */
export function ReorderList<T>({
  items,
  getKey,
  getLabel,
  renderItem,
  onReorder,
  disabled = false,
}: {
  items: T[]
  getKey: (item: T) => string
  /** Used in the live announcement, so it should identify the row. */
  getLabel: (item: T) => string
  renderItem: (item: T) => React.ReactNode
  onReorder: (keysInNewOrder: string[]) => void
  disabled?: boolean
}) {
  const [draggingKey, setDraggingKey] = useState<string | null>(null)
  const [announcement, setAnnouncement] = useState('')

  function move(from: number, to: number) {
    if (to < 0 || to >= items.length || from === to) return

    const next = [...items]
    const [moved] = next.splice(from, 1)
    if (!moved) return
    next.splice(to, 0, moved)

    setAnnouncement(
      `${getLabel(moved)} mutat pe poziția ${to + 1} din ${items.length}.`,
    )
    onReorder(next.map(getKey))
  }

  return (
    <>
      <ul className="space-y-2">
        {items.map((item, index) => {
          const key = getKey(item)

          return (
            <li
              key={key}
              draggable={!disabled}
              onDragStart={() => setDraggingKey(key)}
              onDragEnd={() => setDraggingKey(null)}
              onDragOver={(event) => event.preventDefault()}
              onDrop={(event) => {
                event.preventDefault()
                if (!draggingKey) return
                const from = items.findIndex((i) => getKey(i) === draggingKey)
                setDraggingKey(null)
                move(from, index)
              }}
              className={cn(
                'border-border flex items-center gap-3 rounded-md border px-3 py-2',
                draggingKey === key && 'opacity-50',
              )}
            >
              <GripVertical
                aria-hidden="true"
                className="text-muted-foreground size-4 shrink-0 cursor-grab"
              />

              <div className="min-w-0 flex-1">{renderItem(item)}</div>

              <div className="flex shrink-0 items-center gap-1">
                <button
                  type="button"
                  disabled={disabled || index === 0}
                  onClick={() => move(index, index - 1)}
                  aria-label={`Mută ${getLabel(item)} mai sus`}
                  className="border-border rounded-md border p-1.5 disabled:opacity-40"
                >
                  <ChevronUp aria-hidden="true" className="size-4" />
                </button>
                <button
                  type="button"
                  disabled={disabled || index === items.length - 1}
                  onClick={() => move(index, index + 1)}
                  aria-label={`Mută ${getLabel(item)} mai jos`}
                  className="border-border rounded-md border p-1.5 disabled:opacity-40"
                >
                  <ChevronDown aria-hidden="true" className="size-4" />
                </button>
              </div>
            </li>
          )
        })}
      </ul>

      <p aria-live="polite" className="sr-only">
        {announcement}
      </p>
    </>
  )
}
