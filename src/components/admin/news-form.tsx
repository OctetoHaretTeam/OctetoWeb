import { useState } from 'react'
import { Link } from '@tanstack/react-router'

import { BilingualField } from '@/components/admin/bilingual-field'
import { BilingualMarkdownField } from '@/components/admin/bilingual-markdown-field'
import { GalleryField } from '@/components/admin/gallery-field'
import { ImageField } from '@/components/admin/image-field'
import { useDraftAutosave } from '@/components/admin/use-draft-autosave'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { newsFormSchema } from '@/lib/forms/entities'
import type { ImageAsset } from '@/lib/schemas'

/**
 * The news editor — CLAUDE.md §10. Romanian-only (§11).
 *
 * Publishing is NOT a field here. `publishedAt` is set by its own action on
 * the list, so making a post public is a deliberate act rather than a checkbox
 * someone leaves ticked by accident.
 */

export type NewsFormValues = {
  slug: string
  titleRo: string
  titleEn: string
  excerptRo: string
  excerptEn: string
  bodyRo: string
  bodyEn: string
  coverImage: ImageAsset | null
  gallery: ImageAsset[]
  authorMemberId: string
}

export function emptyNewsForm(): NewsFormValues {
  return {
    slug: '',
    titleRo: '',
    titleEn: '',
    excerptRo: '',
    excerptEn: '',
    bodyRo: '',
    bodyEn: '',
    coverImage: null,
    gallery: [],
    authorMemberId: '',
  }
}

function blankToNull(value: string): string | null {
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : null
}

export function toNewsSubmitValues(
  values: NewsFormValues,
  publishedAt: Date | null,
) {
  return {
    slug: values.slug.trim(),
    titleRo: values.titleRo.trim(),
    titleEn: blankToNull(values.titleEn),
    excerptRo: values.excerptRo.trim(),
    excerptEn: blankToNull(values.excerptEn),
    bodyRo: values.bodyRo,
    bodyEn: blankToNull(values.bodyEn),
    coverImage: values.coverImage,
    gallery: values.gallery,
    publishedAt,
    authorMemberId: blankToNull(values.authorMemberId),
  }
}

export function NewsForm({
  draftKey,
  initialValues,
  authors,
  submitLabel,
  publishedAt,
  onSubmit,
  serverError,
}: {
  draftKey: string
  initialValues: NewsFormValues
  authors: Array<{ id: string; name: string }>
  submitLabel: string
  /** Carried through unchanged — publishing is a separate action. */
  publishedAt: Date | null
  onSubmit: (
    values: ReturnType<typeof toNewsSubmitValues>,
  ) => Promise<void>
  serverError?: string | null
}) {
  const [values, setValues] = useState(initialValues)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)

  const draft = useDraftAutosave({
    key: draftKey,
    values,
    onRestore: setValues,
  })

  function set<K extends keyof NewsFormValues>(
    field: K,
    value: NewsFormValues[K],
  ) {
    setValues((current) => ({ ...current, [field]: value }))
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    setErrors({})

    const payload = toNewsSubmitValues(values, publishedAt)
    const parsed = newsFormSchema.safeParse(payload)

    if (!parsed.success) {
      const fieldErrors: Record<string, string> = {}
      for (const issue of parsed.error.issues) {
        // Index by both the full path and its root, so a nested failure
        // such as `image.alt.ro` is reachable as `image` by the field that
        // renders it.
        const full = issue.path.join('.')
        if (full && !fieldErrors[full]) fieldErrors[full] = issue.message
        const root = issue.path[0]
        if (typeof root === 'string' && !fieldErrors[root]) {
          fieldErrors[root] = issue.message
        }
      }
      setErrors(fieldErrors)
      return
    }

    setSaving(true)
    try {
      await onSubmit(payload)
      draft.clear()
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-3xl space-y-8">
      {draft.recovered ? (
        <div
          role="status"
          className="border-border flex flex-wrap items-center gap-3 rounded-md border px-3 py-2"
        >
          <p className="text-sm">
            Ai o versiune nesalvată de la{' '}
            {new Date(draft.recovered.savedAt).toLocaleString('ro-MD')}.
          </p>
          <div className="ml-auto flex gap-2">
            <Button type="button" size="sm" onClick={draft.restore}>
              Recuperează
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={draft.discard}
            >
              Renunță
            </Button>
          </div>
        </div>
      ) : null}

      {serverError ? (
        <p role="alert" className="text-destructive text-sm">
          {serverError}
        </p>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="news-slug">Slug</Label>
          <Input
            id="news-slug"
            value={values.slug}
            onChange={(event) => set('slug', event.target.value)}
            aria-invalid={errors.slug ? true : undefined}
          />
          <p className="text-muted-foreground text-xs">
            Apare în adresă: /ro/news/&lt;slug&gt;. Același slug pentru ambele
            limbi.
          </p>
          {errors.slug ? (
            <p role="alert" className="text-destructive text-xs">
              {errors.slug}
            </p>
          ) : null}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="news-author">Autor (opțional)</Label>
          <Select
            value={values.authorMemberId || 'none'}
            onValueChange={(value) =>
              set('authorMemberId', value === 'none' ? '' : value)
            }
          >
            <SelectTrigger id="news-author">
              <SelectValue placeholder="Fără autor" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Fără autor</SelectItem>
              {authors.map((author) => (
                <SelectItem key={author.id} value={author.id}>
                  {author.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <BilingualField
        label="Titlu"
        required
        ro={values.titleRo}
        en={values.titleEn}
        onRoChange={(v) => set('titleRo', v)}
        onEnChange={(v) => set('titleEn', v)}
        error={errors.titleRo}
      />

      <BilingualField
        label="Rezumat"
        required
        multiline
        rows={3}
        ro={values.excerptRo}
        en={values.excerptEn}
        onRoChange={(v) => set('excerptRo', v)}
        onEnChange={(v) => set('excerptEn', v)}
        hint="Se afișează pe carduri și în rezultatele de căutare."
        error={errors.excerptRo}
      />

      <BilingualMarkdownField
        label="Text"
        required
        rows={14}
        ro={values.bodyRo}
        en={values.bodyEn}
        onRoChange={(v) => set('bodyRo', v)}
        onEnChange={(v) => set('bodyEn', v)}
        hint="Folosește bara de formatare sau scrie direct Markdown. Ctrl+B îngroșat, Ctrl+I cursiv, Ctrl+K link."
        error={errors.bodyRo}
      />

      <ImageField
        label="Imagine de copertă (opțional)"
        folder="news"
        value={values.coverImage}
        onChange={(value) => set('coverImage', value)}
        hint="Apare pe card și în previzualizarea la partajare."
        error={errors.coverImage}
      />

      <GalleryField
        label="Galerie"
        folder="news"
        max={5}
        value={values.gallery}
        onChange={(value) => set('gallery', value)}
        hint="Până la 5 imagini, afișate în articol."
        error={errors.gallery}
      />

      <div className="flex items-center gap-3">
        <Button type="submit" disabled={saving}>
          {saving ? 'Se salvează…' : submitLabel}
        </Button>
        <Button asChild variant="outline">
          <Link to="/admin/news">Renunță</Link>
        </Button>
      </div>
    </form>
  )
}
