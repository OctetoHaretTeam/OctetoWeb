import { useId } from 'react'

import { MarkdownEditor } from '@/components/admin/markdown-editor'
import { Label } from '@/components/ui/label'

/**
 * A `…Ro` / `…En` markdown body pair — CLAUDE.md §5, §10.
 *
 * Same shape and same rules as `BilingualField`: side by side in one form,
 * English clearly optional because §5 lets it be null and the public page
 * falls back to Romanian with a note. The difference is that each side is a
 * full markdown editor with a formatting bar and a live preview, which is what
 * §10 asks for on every `body` field.
 *
 * Stacked on mobile and side by side from `lg`, not `sm`: two editors plus two
 * toolbars in half a tablet's width wraps the bar onto three rows and leaves
 * the textarea too narrow to read a sentence in.
 */
export function BilingualMarkdownField({
  label,
  ro,
  en,
  onRoChange,
  onEnChange,
  rows = 14,
  required = false,
  error,
  hint,
}: {
  label: string
  ro: string
  en: string
  onRoChange: (value: string) => void
  onEnChange: (value: string) => void
  rows?: number
  /** Marks the Romanian side required. English is never required (§5). */
  required?: boolean
  error?: string
  hint?: string
}) {
  const id = useId().replace(/[^a-zA-Z0-9]/g, '')
  const roId = `${id}-ro`
  const enId = `${id}-en`
  const errorId = `${id}-error`

  return (
    <fieldset className="space-y-2">
      <legend className="text-sm font-medium">
        {label}
        {required ? (
          <span aria-hidden="true" className="text-muted-foreground"> *</span>
        ) : null}
      </legend>

      {hint ? <p className="text-muted-foreground text-xs">{hint}</p> : null}

      <div className="grid gap-3 lg:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor={roId} className="font-mono text-2xs uppercase">
            Română
          </Label>
          <MarkdownEditor
            id={roId}
            lang="ro"
            rows={rows}
            value={ro}
            onChange={onRoChange}
            required={required}
            invalid={Boolean(error)}
            describedBy={error ? errorId : undefined}
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor={enId} className="font-mono text-2xs uppercase">
            Engleză{' '}
            <span className="text-muted-foreground normal-case">
              (opțional)
            </span>
          </Label>
          <MarkdownEditor
            id={enId}
            lang="en"
            rows={rows}
            value={en}
            onChange={onEnChange}
          />
        </div>
      </div>

      {error ? (
        <p id={errorId} role="alert" className="text-destructive text-xs">
          {error}
        </p>
      ) : null}
    </fieldset>
  )
}
