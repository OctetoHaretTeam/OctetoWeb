import { useId, useState } from 'react'
import { upload } from '@vercel/blob/client'
import { Trash2, Upload } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  ALLOWED_UPLOAD_TYPES,
  ImageProcessError,
  processImage,
  uploadPathname,
} from '@/lib/images/process'
import type { ImageAsset } from '@/lib/schemas'

/**
 * Image upload for the admin editors — CLAUDE.md §10.
 *
 * The file is decoded and re-encoded in the browser before a single byte is
 * uploaded, which strips EXIF including GPS (§8) and yields the exact
 * dimensions §12 needs to reserve the image's box.
 *
 * Alt text is bilingual and required in Romanian, because §7.7 asks for alt
 * text on every image in both languages and an image saved without it would be
 * one nobody remembers to come back for.
 */
export function ImageField({
  label,
  folder,
  value,
  onChange,
  required = false,
  hint,
}: {
  label: string
  /** Blob folder, e.g. `team` or `sponsors`. */
  folder: string
  value: ImageAsset | null
  onChange: (value: ImageAsset | null) => void
  required?: boolean
  hint?: string
}) {
  const id = useId().replace(/[^a-zA-Z0-9]/g, '')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleFile(file: File | undefined) {
    if (!file) return
    setError(null)
    setBusy(true)

    try {
      const processed = await processImage(file)

      const blob = await upload(
        uploadPathname(folder, file.name),
        processed.blob,
        {
          access: 'public',
          handleUploadUrl: '/api/blob/upload',
          contentType: 'image/webp',
        },
      )

      onChange({
        url: blob.url,
        alt: { ro: value?.alt.ro ?? '', en: value?.alt.en },
        width: processed.width,
        height: processed.height,
      })
    } catch (caught) {
      setError(messageFor(caught))
    } finally {
      setBusy(false)
    }
  }

  return (
    <fieldset className="space-y-3">
      <legend className="text-sm font-medium">
        {label}
        {required ? (
          <span aria-hidden="true" className="text-muted-foreground"> *</span>
        ) : null}
      </legend>

      {hint ? <p className="text-muted-foreground text-xs">{hint}</p> : null}

      {value ? (
        <div className="border-border flex flex-wrap items-start gap-4 rounded-md border p-3">
          <img
            src={value.url}
            alt=""
            width={value.width}
            height={value.height}
            className="h-24 w-24 rounded object-cover"
          />

          <div className="min-w-0 flex-1 space-y-2">
            <p className="text-muted-foreground font-mono text-2xs">
              {value.width}×{value.height}
            </p>

            <div className="space-y-1.5">
              <Label htmlFor={`${id}-alt-ro`} className="font-mono text-2xs uppercase">
                Text alternativ · Română
              </Label>
              <Input
                id={`${id}-alt-ro`}
                lang="ro"
                value={value.alt.ro}
                onChange={(event) =>
                  onChange({
                    ...value,
                    alt: { ...value.alt, ro: event.target.value },
                  })
                }
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor={`${id}-alt-en`} className="font-mono text-2xs uppercase">
                Text alternativ · Engleză{' '}
                <span className="text-muted-foreground normal-case">
                  (opțional)
                </span>
              </Label>
              <Input
                id={`${id}-alt-en`}
                lang="en"
                value={value.alt.en ?? ''}
                onChange={(event) =>
                  onChange({
                    ...value,
                    alt: {
                      ...value.alt,
                      en: event.target.value || undefined,
                    },
                  })
                }
              />
            </div>
          </div>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onChange(null)}
          >
            <Trash2 aria-hidden="true" className="size-4" />
            Elimină
          </Button>
        </div>
      ) : (
        <div className="border-border rounded-md border border-dashed p-4">
          <Label htmlFor={`${id}-file`} className="sr-only">
            {label}
          </Label>
          <div className="flex flex-wrap items-center gap-3">
            <Upload aria-hidden="true" className="text-muted-foreground size-4" />
            <input
              id={`${id}-file`}
              type="file"
              accept={ALLOWED_UPLOAD_TYPES.join(',')}
              disabled={busy}
              onChange={(event) => void handleFile(event.target.files?.[0])}
              className="text-sm"
            />
          </div>
          <p className="text-muted-foreground mt-2 text-xs">
            {busy
              ? 'Se pregătește și se încarcă…'
              : 'Datele EXIF, inclusiv locația GPS, sunt eliminate în browser înainte de încărcare.'}
          </p>
        </div>
      )}

      {error ? (
        <p role="alert" className="text-destructive text-xs">
          {error}
        </p>
      ) : null}
    </fieldset>
  )
}

function messageFor(caught: unknown): string {
  if (caught instanceof ImageProcessError) {
    switch (caught.reason) {
      case 'type-not-allowed':
        return 'Formatul nu este acceptat. Folosește JPEG, PNG, WebP sau AVIF.'
      case 'too-large':
        return 'Fișierul este prea mare. Maxim 12 MB.'
      case 'decode-failed':
        return 'Imaginea nu a putut fi citită. Poate fi deteriorată.'
      case 'encode-failed':
        return 'Imaginea nu a putut fi procesată în browser.'
    }
  }

  return 'Încărcarea a eșuat. Verifică conexiunea și încearcă din nou.'
}
