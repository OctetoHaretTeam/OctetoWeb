import { useState } from 'react'
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
 * A capped image gallery — CLAUDE.md §10.
 *
 * Several files can be picked at once, each processed and uploaded in turn.
 * Like `ImageField`, every file is re-encoded in the browser first, so EXIF
 * and GPS never leave the device (§8) and exact dimensions come back with it.
 *
 * The cap is enforced here for the person using the panel and again by the
 * schema on the server, which is the actual control (§10).
 */
export function GalleryField({
  label,
  folder,
  max,
  value,
  onChange,
  hint,
  error,
}: {
  label: string
  folder: string
  max: number
  value: ImageAsset[]
  onChange: (value: ImageAsset[]) => void
  hint?: string
  error?: string
}) {
  const [busy, setBusy] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const remaining = max - value.length

  const missingAlt = value.some((image) => image.alt.ro.trim().length === 0)
  const shown =
    uploadError ??
    (missingAlt ? 'Fiecare imagine are nevoie de text alternativ în română.' : error)

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return

    setUploadError(null)

    const picked = Array.from(files)
    if (picked.length > remaining) {
      setUploadError(
        `Mai încap ${remaining} ${remaining === 1 ? 'imagine' : 'imagini'}.`,
      )
      return
    }

    setBusy(true)
    const added: ImageAsset[] = []

    try {
      for (const file of picked) {
        const processed = await processImage(file)

        const body = new FormData()
        body.append(
          'file',
          new File([processed.blob], uploadPathname(folder, file.name), {
            type: 'image/webp',
          }),
        )
        body.append('folder', folder)

        const response = await fetch('/api/upload', { method: 'POST', body })
        if (!response.ok) throw new Error('upload-failed')

        const stored = (await response.json()) as { url: string }
        added.push({
          url: stored.url,
          alt: { ro: '' },
          width: processed.width,
          height: processed.height,
        })
      }

      // Applied once, so a failure part-way through does not leave the form
      // holding images the server never received.
      onChange([...value, ...added])
    } catch (caught) {
      setUploadError(
        caught instanceof ImageProcessError
          ? 'O imagine nu a putut fi procesată. Verifică formatul și mărimea.'
          : 'Încărcarea a eșuat. Încearcă din nou.',
      )
    } finally {
      setBusy(false)
    }
  }

  function update(index: number, next: ImageAsset) {
    onChange(value.map((image, i) => (i === index ? next : image)))
  }

  return (
    <fieldset className="space-y-3">
      <legend className="text-sm font-medium">
        {label}{' '}
        <span className="text-muted-foreground font-normal">
          ({value.length}/{max})
        </span>
      </legend>

      {hint ? <p className="text-muted-foreground text-xs">{hint}</p> : null}

      {value.length > 0 ? (
        <ul className="space-y-2">
          {value.map((image, index) => (
            <li
              key={`${image.url}-${index}`}
              className="border-border flex flex-wrap items-start gap-3 rounded-md border p-3"
            >
              <img
                src={image.url}
                alt=""
                width={image.width}
                height={image.height}
                className="h-16 w-16 rounded object-cover"
              />

              <div className="min-w-0 flex-1 space-y-1.5">
                <Label
                  htmlFor={`gallery-alt-${folder}-${index}`}
                  className="font-mono text-2xs uppercase"
                >
                  Text alternativ · Română
                </Label>
                <Input
                  id={`gallery-alt-${folder}-${index}`}
                  lang="ro"
                  value={image.alt.ro}
                  aria-invalid={image.alt.ro.trim() ? undefined : true}
                  onChange={(event) =>
                    update(index, {
                      ...image,
                      alt: { ...image.alt, ro: event.target.value },
                    })
                  }
                />
                <p className="text-muted-foreground font-mono text-2xs">
                  {image.width}×{image.height}
                </p>
              </div>

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => onChange(value.filter((_, i) => i !== index))}
              >
                <Trash2 aria-hidden="true" className="size-4" />
                <span className="sr-only">Elimină imaginea {index + 1}</span>
              </Button>
            </li>
          ))}
        </ul>
      ) : null}

      {remaining > 0 ? (
        <div className="border-border rounded-md border border-dashed p-4">
          <div className="flex flex-wrap items-center gap-3">
            <Upload aria-hidden="true" className="text-muted-foreground size-4" />
            <Label htmlFor={`gallery-${folder}`} className="sr-only">
              {label}
            </Label>
            <input
              id={`gallery-${folder}`}
              type="file"
              multiple
              accept={ALLOWED_UPLOAD_TYPES.join(',')}
              disabled={busy}
              onChange={(event) => {
                void handleFiles(event.target.files)
                event.target.value = ''
              }}
              className="text-sm"
            />
          </div>
          <p className="text-muted-foreground mt-2 text-xs">
            {busy
              ? 'Se încarcă…'
              : `Mai poți adăuga ${remaining} ${remaining === 1 ? 'imagine' : 'imagini'}. Datele EXIF se elimină în browser.`}
          </p>
        </div>
      ) : (
        <p className="text-muted-foreground text-xs">
          Ai atins limita de {max} imagini. Elimină una ca să adaugi alta.
        </p>
      )}

      {shown ? (
        <p role="alert" className="text-destructive text-xs">
          {shown}
        </p>
      ) : null}
    </fieldset>
  )
}
