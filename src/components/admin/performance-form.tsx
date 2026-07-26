import { useState } from 'react'
import { Link } from '@tanstack/react-router'

import { BilingualField } from '@/components/admin/bilingual-field'
import { GalleryField } from '@/components/admin/gallery-field'
import { ImageField } from '@/components/admin/image-field'
import { useDraftAutosave } from '@/components/admin/use-draft-autosave'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  NON_TECH_CATEGORY_VALUES,
  TECH_CATEGORY_VALUES,
  performanceFormSchema,
} from '@/lib/forms/entities'
import type { ImageAsset } from '@/lib/schemas'

/**
 * The performance entry editor — CLAUDE.md §10.
 *
 * Changing the branch narrows the category list to that branch's values and
 * resets a category that no longer belongs. §5 enforces the pairing with a
 * check constraint anyway; this stops the person editing from ever reaching
 * that error.
 */

const CATEGORY_LABELS: Record<string, string> = {
  innovation: 'Inovație',
  design: 'Design',
  cad: 'CAD',
  code: 'Cod',
  mechanical: 'Mecanică',
  testing: 'Testare',
  outreach: 'Outreach',
  sponsorship: 'Sponsorizare',
  pr_media: 'PR și media',
  events: 'Evenimente',
  collaboration: 'Colaborare',
  accessibility: 'Accesibilitate',
}

export type PerformanceFormValues = {
  slug: string
  branch: 'tech' | 'non_tech'
  category: string
  titleRo: string
  titleEn: string
  summaryRo: string
  summaryEn: string
  bodyRo: string
  bodyEn: string
  coverImage: ImageAsset | null
  gallery: ImageAsset[]
  date: string
  seasonId: string
  peopleReached: string
  schoolsVisited: string
  fundsRaisedMdl: string
  isFeatured: boolean
  displayOrder: string
}

export function emptyPerformanceForm(displayOrder: number): PerformanceFormValues {
  return {
    slug: '',
    branch: 'tech',
    category: 'innovation',
    titleRo: '',
    titleEn: '',
    summaryRo: '',
    summaryEn: '',
    bodyRo: '',
    bodyEn: '',
    coverImage: null,
    gallery: [],
    date: '',
    seasonId: '',
    peopleReached: '',
    schoolsVisited: '',
    fundsRaisedMdl: '',
    isFeatured: false,
    displayOrder: String(displayOrder),
  }
}

const blankToNull = (v: string) => (v.trim() ? v.trim() : null)
const numberOrUndefined = (v: string) =>
  v.trim() ? Number.parseInt(v, 10) : undefined

export function toPerformanceSubmitValues(values: PerformanceFormValues) {
  const metrics = {
    peopleReached: numberOrUndefined(values.peopleReached),
    schoolsVisited: numberOrUndefined(values.schoolsVisited),
    fundsRaisedMdl: numberOrUndefined(values.fundsRaisedMdl),
  }

  const hasMetric = Object.values(metrics).some((v) => v !== undefined)

  return {
    slug: values.slug.trim(),
    branch: values.branch,
    category: values.category as never,
    titleRo: values.titleRo.trim(),
    titleEn: blankToNull(values.titleEn),
    summaryRo: values.summaryRo.trim(),
    summaryEn: blankToNull(values.summaryEn),
    bodyRo: values.bodyRo,
    bodyEn: blankToNull(values.bodyEn),
    coverImage: values.coverImage,
    gallery: values.gallery,
    date: values.date.trim(),
    seasonId: values.seasonId || null,
    // No metric entered means no metrics object — never a row of zeroes (§13).
    metrics: hasMetric ? metrics : null,
    isFeatured: values.isFeatured,
    displayOrder: Number.parseInt(values.displayOrder, 10),
  }
}

export function PerformanceForm({
  draftKey,
  initialValues,
  seasons,
  submitLabel,
  onSubmit,
  serverError,
}: {
  draftKey: string
  initialValues: PerformanceFormValues
  seasons: Array<{ id: string; name: string }>
  submitLabel: string
  onSubmit: (
    values: ReturnType<typeof toPerformanceSubmitValues>,
  ) => Promise<void>
  serverError?: string | null
}) {
  const [values, setValues] = useState(initialValues)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)

  const draft = useDraftAutosave({ key: draftKey, values, onRestore: setValues })

  const categories =
    values.branch === 'tech' ? TECH_CATEGORY_VALUES : NON_TECH_CATEGORY_VALUES

  function set<K extends keyof PerformanceFormValues>(
    field: K,
    value: PerformanceFormValues[K],
  ) {
    setValues((current) => ({ ...current, [field]: value }))
  }

  function setBranch(branch: PerformanceFormValues['branch']) {
    const allowed =
      branch === 'tech' ? TECH_CATEGORY_VALUES : NON_TECH_CATEGORY_VALUES

    setValues((current) => ({
      ...current,
      branch,
      // Reset a category that no longer belongs to the chosen branch.
      category: (allowed as readonly string[]).includes(current.category)
        ? current.category
        : allowed[0],
    }))
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    setErrors({})

    const parsed = performanceFormSchema.safeParse(
      toPerformanceSubmitValues(values),
    )

    if (!parsed.success) {
      const fieldErrors: Record<string, string> = {}
      for (const issue of parsed.error.issues) {
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
      await onSubmit(toPerformanceSubmitValues(values))
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
        <div className="space-y-1.5">
          <Label htmlFor="perf-slug">Slug</Label>
          <Input
            id="perf-slug"
            value={values.slug}
            aria-invalid={errors.slug ? true : undefined}
            onChange={(e) => set('slug', e.target.value)}
          />
          {errors.slug ? (
            <p role="alert" className="text-destructive text-xs">
              {errors.slug}
            </p>
          ) : null}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="perf-date">Data (AAAA-LL-ZZ)</Label>
          <Input
            id="perf-date"
            value={values.date}
            aria-invalid={errors.date ? true : undefined}
            onChange={(e) => set('date', e.target.value)}
          />
          {errors.date ? (
            <p role="alert" className="text-destructive text-xs">
              {errors.date}
            </p>
          ) : null}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="perf-branch">Ramură</Label>
          <Select
            value={values.branch}
            onValueChange={(v) => setBranch(v as PerformanceFormValues['branch'])}
          >
            <SelectTrigger id="perf-branch">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="tech">Tehnic</SelectItem>
              <SelectItem value="non_tech">Non-tehnic</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="perf-category">Categorie</Label>
          <Select
            value={values.category}
            onValueChange={(v) => set('category', v)}
          >
            <SelectTrigger id="perf-category">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {categories.map((category) => (
                <SelectItem key={category} value={category}>
                  {CATEGORY_LABELS[category] ?? category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.category ? (
            <p role="alert" className="text-destructive text-xs">
              {errors.category}
            </p>
          ) : null}
        </div>

        <div className="space-y-1.5 sm:col-span-2">
          <Label htmlFor="perf-season">Sezon (opțional)</Label>
          <Select
            value={values.seasonId || 'none'}
            onValueChange={(v) => set('seasonId', v === 'none' ? '' : v)}
          >
            <SelectTrigger id="perf-season">
              <SelectValue placeholder="Fără sezon" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Fără sezon</SelectItem>
              {seasons.map((season) => (
                <SelectItem key={season.id} value={season.id}>
                  {season.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <BilingualField label="Titlu" required ro={values.titleRo} en={values.titleEn}
        onRoChange={(v) => set('titleRo', v)} onEnChange={(v) => set('titleEn', v)}
        error={errors.titleRo} />

      <BilingualField label="Rezumat" required multiline rows={3}
        ro={values.summaryRo} en={values.summaryEn}
        onRoChange={(v) => set('summaryRo', v)} onEnChange={(v) => set('summaryEn', v)}
        error={errors.summaryRo} />

      <BilingualField label="Text (Markdown)" required multiline rows={12}
        ro={values.bodyRo} en={values.bodyEn}
        onRoChange={(v) => set('bodyRo', v)} onEnChange={(v) => set('bodyEn', v)}
        error={errors.bodyRo} />

      <ImageField label="Imagine de copertă (opțional)" folder="performance"
        value={values.coverImage} onChange={(v) => set('coverImage', v)}
        error={errors.coverImage} />

      <GalleryField label="Galerie" folder="performance" max={10}
        value={values.gallery} onChange={(v) => set('gallery', v)}
        error={errors.gallery} />

      <fieldset className="space-y-2">
        <legend className="text-sm font-medium">Metrici (opțional)</legend>
        <p className="text-muted-foreground text-xs">
          Alimentează rândul de statistici de pe pagina principală. Lasă gol
          dacă nu ai cifre — nu inventa.
        </p>
        <div className="grid gap-3 sm:grid-cols-3">
          <Metric id="perf-people" label="Persoane implicate"
            value={values.peopleReached} onChange={(v) => set('peopleReached', v)} />
          <Metric id="perf-schools" label="Școli vizitate"
            value={values.schoolsVisited} onChange={(v) => set('schoolsVisited', v)} />
          <Metric id="perf-funds" label="Fonduri (MDL)"
            value={values.fundsRaisedMdl} onChange={(v) => set('fundsRaisedMdl', v)} />
        </div>
      </fieldset>

      <div className="flex items-center gap-2">
        <Checkbox
          id="perf-featured"
          checked={values.isFeatured}
          onCheckedChange={(checked) => set('isFeatured', checked === true)}
        />
        <Label htmlFor="perf-featured">Evidențiat</Label>
      </div>

      <div className="flex items-center gap-3">
        <Button type="submit" disabled={saving}>
          {saving ? 'Se salvează…' : submitLabel}
        </Button>
        <Button asChild variant="outline">
          <Link to="/admin/performance">Renunță</Link>
        </Button>
      </div>
    </form>
  )
}

function Metric({
  id,
  label,
  value,
  onChange,
}: {
  id: string
  label: string
  value: string
  onChange: (value: string) => void
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        type="number"
        min={0}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </div>
  )
}
