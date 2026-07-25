import { useId } from 'react'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

/**
 * A `…Ro` / `…En` column pair, edited side by side in one form — CLAUDE.md §10.
 *
 * Never two separate records and never two separate screens: the whole point
 * is that whoever writes the Romanian can see how much English is missing.
 * English is clearly marked optional, because §5 allows it to be null and the
 * site falls back to Romanian with a note rather than rendering an empty block.
 */
export function BilingualField({
  label,
  ro,
  en,
  onRoChange,
  onEnChange,
  multiline = false,
  rows = 4,
  required = false,
  error,
  hint,
}: {
  label: string
  ro: string
  en: string
  onRoChange: (value: string) => void
  onEnChange: (value: string) => void
  multiline?: boolean
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

  const Field = multiline ? Textarea : Input

  return (
    <fieldset className="space-y-2">
      <legend className="text-sm font-medium">
        {label}
        {required ? (
          <span aria-hidden="true" className="text-muted-foreground"> *</span>
        ) : null}
      </legend>

      {hint ? <p className="text-muted-foreground text-xs">{hint}</p> : null}

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor={roId} className="font-mono text-2xs uppercase">
            Română
          </Label>
          <Field
            id={roId}
            lang="ro"
            rows={multiline ? rows : undefined}
            value={ro}
            required={required}
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? errorId : undefined}
            onChange={(event) => onRoChange(event.target.value)}
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor={enId} className="font-mono text-2xs uppercase">
            Engleză{' '}
            <span className="text-muted-foreground normal-case">
              (opțional)
            </span>
          </Label>
          <Field
            id={enId}
            lang="en"
            rows={multiline ? rows : undefined}
            value={en}
            onChange={(event) => onEnChange(event.target.value)}
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
