import { useState } from 'react'
import { Maximize2, Minimize2, Trash2, Upload } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  ALLOWED_UPLOAD_TYPES,
  ImageProcessError,
  processImage,
  uploadPathname,
} from '@/lib/images/process'
import {
  type ImageAsset,
  type ImageFit,
  imageFitClass,
} from '@/lib/schemas'
import { cn } from '@/lib/utils'

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
    (missingAlt
      ? 'Fiecare imagine are nevoie de text alternativ în română.'
      : error)

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
          fit: 'contain',
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

  function applyFitToAll(nextFit: ImageFit) {
    onChange(value.map((image) => ({ ...image, fit: nextFit })))
  }

  return (
    <fieldset className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <legend className="text-sm font-medium">
          {label}{' '}
          <span className="text-muted-foreground font-normal">
            ({value.length}/{max})
          </span>
        </legend>

        {value.length > 1 ? (
          <div className="flex flex-wrap items-center gap-1.5">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => applyFitToAll('contain')}
              className="h-7 px-2 text-2xs"
            >
              <Minimize2 aria-hidden="true" className="size-3" />
              Aplică „Contain” la toate
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => applyFitToAll('cover')}
              className="h-7 px-2 text-2xs"
            >
              <Maximize2 aria-hidden="true" className="size-3" />
              Aplică „Cover” la toate
            </Button>
          </div>
        ) : null}
      </div>

      {hint ? <p className="text-muted-foreground text-xs">{hint}</p> : null}

      {value.length > 0 ? (
        <ul className="space-y-2">
          {value.map((image, index) => {
            const currentFit: ImageFit = image.fit ?? 'contain'
            return (
              <li
                key={`${image.url}-${index}`}
                className="border-border flex flex-wrap items-start gap-3 rounded-md border p-3"
              >
                <div className="space-y-1">
                  <div className="border-border bg-branch-surface aspect-[4/3] w-36 shrink-0 overflow-hidden rounded-md border">
                    <img
                      src={image.url}
                      alt=""
                      width={image.width}
                      height={image.height}
                      className={cn(
                        'h-full w-full transition-all duration-150',
                        imageFitClass(image),
                      )}
                    />
                  </div>
                  <p className="text-muted-foreground font-mono text-2xs">
                    Previzualizare (4:3) · {image.width}×{image.height}
                  </p>
                </div>

                <div className="min-w-0 flex-1 space-y-2">
                  <div
                    role="group"
                    aria-label={`Mod de încadrare pentru imaginea ${index + 1}`}
                    className="flex flex-wrap gap-1.5"
                  >
                    <Button
                      type="button"
                      size="sm"
                      variant={currentFit === 'contain' ? 'default' : 'outline'}
                      aria-pressed={currentFit === 'contain'}
                      onClick={() =>
                        update(index, { ...image, fit: 'contain' })
                      }
                      className="h-7 px-2.5 text-xs"
                    >
                      <Minimize2 aria-hidden="true" className="size-3" />
                      Încadrează tot (Contain)
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant={currentFit === 'cover' ? 'default' : 'outline'}
                      aria-pressed={currentFit === 'cover'}
                      onClick={() => update(index, { ...image, fit: 'cover' })}
                      className="h-7 px-2.5 text-xs"
                    >
                      <Maximize2 aria-hidden="true" className="size-3" />
                      Umple spațiul (Cover)
                    </Button>
                  </div>

                  <div className="space-y-1">
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
                  </div>
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
            )
          })}
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
