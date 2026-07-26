import { useState } from 'react'
import { Link } from '@tanstack/react-router'

import { BilingualField } from '@/components/admin/bilingual-field'
import { GalleryField } from '@/components/admin/gallery-field'
import { ImageField } from '@/components/admin/image-field'
import { useDraftAutosave } from '@/components/admin/use-draft-autosave'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { seasonFormSchema } from '@/lib/forms/entities'
import type { ImageAsset } from '@/lib/schemas'

export type SeasonFormValues = {
  slug: string
  name: string
  gameName: string
  startDate: string
  endDate: string
  descriptionRo: string
  descriptionEn: string
  coverImage: ImageAsset | null
  gallery: ImageAsset[]
  portfolioUrl: string
  isCurrent: boolean
  displayOrder: string
}

export function emptySeasonForm(displayOrder: number): SeasonFormValues {
  return {
    slug: '',
    name: '',
    gameName: '',
    startDate: '',
    endDate: '',
    descriptionRo: '',
    descriptionEn: '',
    coverImage: null,
    gallery: [],
    portfolioUrl: '',
    isCurrent: false,
    displayOrder: String(displayOrder),
  }
}

function blankToNull(value: string): string | null {
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : null
}

export function toSeasonSubmitValues(values: SeasonFormValues) {
  return {
    slug: values.slug.trim(),
    name: values.name.trim(),
    gameName: values.gameName.trim(),
    startDate: values.startDate.trim(),
    endDate: blankToNull(values.endDate),
    descriptionRo: values.descriptionRo.trim(),
    descriptionEn: blankToNull(values.descriptionEn),
    coverImage: values.coverImage,
    gallery: values.gallery,
    portfolioUrl: blankToNull(values.portfolioUrl),
    isCurrent: values.isCurrent,
    displayOrder: Number.parseInt(values.displayOrder, 10),
  }
}

export function SeasonForm({
  draftKey,
  initialValues,
  submitLabel,
  onSubmit,
  serverError,
}: {
  draftKey: string
  initialValues: SeasonFormValues
  submitLabel: string
  onSubmit: (values: ReturnType<typeof toSeasonSubmitValues>) => Promise<void>
  serverError?: string | null
}) {
  const [values, setValues] = useState(initialValues)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)

  const draft = useDraftAutosave({ key: draftKey, values, onRestore: setValues })

  function set<K extends keyof SeasonFormValues>(
    field: K,
    value: SeasonFormValues[K],
  ) {
    setValues((current) => ({ ...current, [field]: value }))
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    setErrors({})

    const parsed = seasonFormSchema.safeParse(toSeasonSubmitValues(values))
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
      await onSubmit(toSeasonSubmitValues(values))
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
            <Button type="button" size="sm" variant="outline" onClick={draft.discard}>
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
        <TextField
          id="season-slug"
          label="Slug"
          hint="Apare în adresă: /ro/seasons/<slug>."
          value={values.slug}
          error={errors.slug}
          onChange={(v) => set('slug', v)}
        />
        <TextField
          id="season-name"
          label="Nume sezon"
          hint="De exemplu 2025–2026."
          value={values.name}
          error={errors.name}
          onChange={(v) => set('name', v)}
        />
        <TextField
          id="season-game"
          label="Numele jocului"
          hint="De exemplu DECODE."
          value={values.gameName}
          error={errors.gameName}
          onChange={(v) => set('gameName', v)}
        />
        <TextField
          id="season-portfolio"
          label="Portofoliu (URL, opțional)"
          hint="PDF-ul încărcat în Vercel Blob."
          value={values.portfolioUrl}
          error={errors.portfolioUrl}
          onChange={(v) => set('portfolioUrl', v)}
        />
        <TextField
          id="season-start"
          label="Început"
          hint="AAAA-LL-ZZ."
          value={values.startDate}
          error={errors.startDate}
          onChange={(v) => set('startDate', v)}
        />
        <TextField
          id="season-end"
          label="Sfârșit (opțional)"
          hint="Lasă gol cât timp sezonul e în desfășurare."
          value={values.endDate}
          error={errors.endDate}
          onChange={(v) => set('endDate', v)}
        />
      </div>

      <BilingualField
        label="Descriere"
        required
        multiline
        rows={5}
        ro={values.descriptionRo}
        en={values.descriptionEn}
        onRoChange={(v) => set('descriptionRo', v)}
        onEnChange={(v) => set('descriptionEn', v)}
        error={errors.descriptionRo}
      />

      <ImageField
        label="Imagine de copertă (opțional)"
        folder="seasons"
        value={values.coverImage}
        onChange={(value) => set('coverImage', value)}
        error={errors.coverImage}
      />

      <GalleryField
        label="Galerie"
        folder="seasons"
        max={10}
        value={values.gallery}
        onChange={(value) => set('gallery', value)}
        hint="Până la 10 imagini din sezon."
        error={errors.gallery}
      />

      <div className="border-border flex items-start gap-3 rounded-md border px-3 py-3">
        <Switch
          id="season-current"
          checked={values.isCurrent}
          onCheckedChange={(v) => set('isCurrent', v)}
          aria-describedby="season-current-description"
        />
        <div className="space-y-0.5">
          <Label htmlFor="season-current">Sezonul curent</Label>
          <p id="season-current-description" className="text-muted-foreground text-xs">
            Un singur sezon poate fi curent. Pornind acesta, celelalte se opresc
            automat.
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Button type="submit" disabled={saving}>
          {saving ? 'Se salvează…' : submitLabel}
        </Button>
        <Button asChild variant="outline">
          <Link to="/admin/seasons">Renunță</Link>
        </Button>
      </div>
    </form>
  )
}

function TextField({
  id,
  label,
  hint,
  value,
  error,
  onChange,
}: {
  id: string
  label: string
  hint: string
  value: string
  error?: string
  onChange: (value: string) => void
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        value={value}
        aria-invalid={error ? true : undefined}
        onChange={(event) => onChange(event.target.value)}
      />
      <p className="text-muted-foreground text-xs">{hint}</p>
      {error ? (
        <p role="alert" className="text-destructive text-xs">
          {error}
        </p>
      ) : null}
    </div>
  )
}
