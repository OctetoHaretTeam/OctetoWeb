import { useEffect, useState } from 'react'
import { createFileRoute, useRouter } from '@tanstack/react-router'
import { Maximize2, Minimize2 } from 'lucide-react'

import { ConfirmDialog } from '@/components/admin/confirm-dialog'
import { ImageField } from '@/components/admin/image-field'
import { ReorderList } from '@/components/admin/reorder-list'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { homeSlideFormSchema } from '@/lib/forms/entities'
import {
  type ImageAsset,
  type ImageFit,
  imageFitClass,
} from '@/lib/schemas'
import { cn } from '@/lib/utils'
import {
  type AdminHomeSlide,
  adminCreateHomeSlide,
  adminDeleteHomeSlide,
  adminListHomeSlides,
  adminNextSlideOrder,
  adminReorderHomeSlides,
  adminUpdateHomeSlide,
} from '@/server/admin/misc'

/**
 * Home slides — CLAUDE.md §4 and §10.
 *
 * One page with an inline add form: a slide is an image and a caption, and
 * seeing the running order while adding one is the whole job.
 */
export const Route = createFileRoute('/admin/_authed/home-slides/')({
  loader: async () => {
    const [slides, nextOrder] = await Promise.all([
      adminListHomeSlides(),
      adminNextSlideOrder(),
    ])
    return { slides, nextOrder }
  },
  component: AdminHomeSlides,
})

function AdminHomeSlides() {
  const loaded = Route.useLoaderData()
  const router = useRouter()
  const [slides, setSlides] = useState(loaded.slides)
  const [image, setImage] = useState<ImageAsset | null>(null)
  const [captionRo, setCaptionRo] = useState('')
  const [linkPath, setLinkPath] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setSlides(loaded.slides)
  }, [loaded.slides])

  async function run(action: () => Promise<unknown>, message: string) {
    setBusy(true)
    setError(null)
    try {
      await action()
      await router.invalidate()
    } catch {
      setError(message)
    } finally {
      setBusy(false)
    }
  }

  async function handleAdd(event: React.FormEvent) {
    event.preventDefault()
    setError(null)

    const payload = {
      image: image as ImageAsset,
      captionRo: captionRo.trim() || null,
      captionEn: null,
      linkPath: linkPath.trim() || null,
      isActive: true,
      displayOrder: loaded.nextOrder,
    }

    const parsed = homeSlideFormSchema.safeParse(payload)
    if (!parsed.success) {
      setError(
        !image
          ? 'Adaugă o imagine.'
          : (parsed.error.issues[0]?.message ?? 'Slide-ul nu este valid.'),
      )
      return
    }

    setBusy(true)
    try {
      await adminCreateHomeSlide({ data: payload })
      setImage(null)
      setCaptionRo('')
      setLinkPath('')
      await router.invalidate()
    } catch {
      setError('Slide-ul nu a putut fi salvat.')
    } finally {
      setBusy(false)
    }
  }

  async function handleReorder(ids: string[]) {
    const byId = new Map(slides.map((s) => [s.id, s]))
    const next = ids
      .map((id) => byId.get(id))
      .filter((s): s is AdminHomeSlide => Boolean(s))

    const previous = slides
    setSlides(next)
    try {
      await adminReorderHomeSlides({ data: { ids } })
      await router.invalidate()
    } catch {
      setSlides(previous)
      setError('Ordinea nu a putut fi salvată.')
    }
  }

  function handleSlideFitChange(slide: AdminHomeSlide, nextFit: ImageFit) {
    const nextImage: ImageAsset = { ...slide.image, fit: nextFit }
    setSlides((prev) =>
      prev.map((s) => (s.id === slide.id ? { ...s, image: nextImage } : s)),
    )
    void run(
      () =>
        adminUpdateHomeSlide({
          data: {
            id: slide.id,
            values: {
              image: nextImage,
              captionRo: slide.captionRo,
              captionEn: slide.captionEn,
              linkPath: slide.linkPath,
              displayOrder: slide.displayOrder,
              isActive: slide.isActive,
            },
          },
        }),
      'Slide-ul nu a putut fi actualizat.',
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">Slide-uri acasă</h2>
        <p className="text-muted-foreground text-sm">
          Primul slide activ apare în capul paginii principale.
        </p>
      </div>

      {error ? (
        <p role="alert" className="text-destructive text-sm">
          {error}
        </p>
      ) : null}

      <form
        onSubmit={handleAdd}
        className="border-border space-y-4 rounded-md border p-4"
      >
        <ImageField
          label="Imagine"
          required
          folder="home"
          value={image}
          onChange={setImage}
        />

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="slide-caption">Legendă (opțional)</Label>
            <Input
              id="slide-caption"
              value={captionRo}
              onChange={(event) => setCaptionRo(event.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="slide-link">Link (opțional)</Label>
            <Input
              id="slide-link"
              placeholder="/team"
              value={linkPath}
              onChange={(event) => setLinkPath(event.target.value)}
            />
            <p className="text-muted-foreground text-xs">
              Fără prefix de limbă — se adaugă automat.
            </p>
          </div>
        </div>

        <Button type="submit" disabled={busy}>
          Adaugă slide
        </Button>
      </form>

      {slides.length === 0 ? (
        <div className="border-border rounded-md border border-dashed p-6">
          <p className="font-medium">Încă niciun slide</p>
          <p className="text-muted-foreground mt-1 text-sm">
            Fără slide-uri, pagina principală folosește sigla echipei.
          </p>
        </div>
      ) : (
        <ReorderList
          items={slides}
          disabled={busy}
          getKey={(s) => s.id}
          getLabel={(s) => s.captionRo ?? 'slide'}
          onReorder={handleReorder}
          renderItem={(slide) => {
            const currentFit: ImageFit = slide.image.fit ?? 'contain'
            return (
              <div className="flex flex-wrap items-center gap-3">
                <div className="border-border bg-branch-surface aspect-[4/3] w-24 shrink-0 overflow-hidden rounded border">
                  <img
                    src={slide.image.url}
                    alt=""
                    width={slide.image.width}
                    height={slide.image.height}
                    className={cn(
                      'h-full w-full transition-all duration-150',
                      imageFitClass(slide.image),
                    )}
                  />
                </div>
                <span className="text-sm">{slide.captionRo ?? '—'}</span>
                {slide.linkPath ? (
                  <span className="text-muted-foreground font-mono text-2xs">
                    → {slide.linkPath}
                  </span>
                ) : null}

                <div className="ml-auto flex flex-wrap items-center gap-3">
                  <div
                    role="group"
                    aria-label="Mod de încadrare slide"
                    className="flex items-center gap-1"
                  >
                    <Button
                      type="button"
                      size="sm"
                      disabled={busy}
                      variant={currentFit === 'contain' ? 'default' : 'outline'}
                      aria-pressed={currentFit === 'contain'}
                      onClick={() => handleSlideFitChange(slide, 'contain')}
                      className="h-7 px-2 text-2xs"
                    >
                      <Minimize2 aria-hidden="true" className="size-3" />
                      Contain
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      disabled={busy}
                      variant={currentFit === 'cover' ? 'default' : 'outline'}
                      aria-pressed={currentFit === 'cover'}
                      onClick={() => handleSlideFitChange(slide, 'cover')}
                      className="h-7 px-2 text-2xs"
                    >
                      <Maximize2 aria-hidden="true" className="size-3" />
                      Cover
                    </Button>
                  </div>

                  <div className="flex items-center gap-2">
                    <Switch
                      id={`slide-active-${slide.id}`}
                      checked={slide.isActive}
                      disabled={busy}
                      onCheckedChange={(checked) =>
                        void run(
                          () =>
                            adminUpdateHomeSlide({
                              data: {
                                id: slide.id,
                                values: {
                                  image: slide.image,
                                  captionRo: slide.captionRo,
                                  captionEn: slide.captionEn,
                                  linkPath: slide.linkPath,
                                  displayOrder: slide.displayOrder,
                                  isActive: checked,
                                },
                              },
                            }),
                          'Slide-ul nu a putut fi actualizat.',
                        )
                      }
                    />
                    <Label
                      htmlFor={`slide-active-${slide.id}`}
                      className="text-xs"
                    >
                      activ
                    </Label>
                  </div>

                  <ConfirmDialog
                    trigger={
                      <button
                        type="button"
                        className="text-destructive text-xs underline"
                      >
                        Șterge
                      </button>
                    }
                    title="Ștergi slide-ul?"
                    description="Slide-ul dispare de pe pagina principală. Acțiunea nu poate fi anulată."
                    confirmLabel="Șterge"
                    disabled={busy}
                    onConfirm={() =>
                      void run(
                        () => adminDeleteHomeSlide({ data: { id: slide.id } }),
                        'Slide-ul nu a putut fi șters.',
                      )
                    }
                  />
                </div>
              </div>
            )
          }}
        />
      )}
    </div>
  )
}
