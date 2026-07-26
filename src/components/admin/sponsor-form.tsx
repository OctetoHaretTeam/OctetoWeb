import { useState } from 'react'
import { Link } from '@tanstack/react-router'

import { BilingualField } from '@/components/admin/bilingual-field'
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
import { SPONSOR_TIERS, sponsorFormSchema } from '@/lib/forms/entities'
import type { ImageAsset } from '@/lib/schemas'

/** §5's tier enum, in the order a sponsor wall would show them. */
const TIER_LABELS: Record<(typeof SPONSOR_TIERS)[number], string> = {
  platinum: 'Platină',
  gold: 'Aur',
  silver: 'Argint',
  partner: 'Partener',
  in_kind: 'În natură',
}

export type SponsorFormValues = {
  name: string
  logo: ImageAsset | null
  logoDark: ImageAsset | null
  descriptionRo: string
  descriptionEn: string
  websiteUrl: string
  tier: string
  activeSeasons: string[]
  displayOrder: string
}

export function emptySponsorForm(displayOrder: number): SponsorFormValues {
  return {
    name: '',
    logo: null,
    logoDark: null,
    descriptionRo: '',
    descriptionEn: '',
    websiteUrl: '',
    tier: 'none',
    activeSeasons: [],
    displayOrder: String(displayOrder),
  }
}

function blankToNull(value: string): string | null {
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : null
}

export function toSponsorSubmitValues(values: SponsorFormValues) {
  return {
    name: values.name.trim(),
    // Validated by the schema — a sponsor without a logo cannot be saved.
    logo: values.logo as ImageAsset,
    logoDark: values.logoDark,
    descriptionRo: blankToNull(values.descriptionRo),
    descriptionEn: blankToNull(values.descriptionEn),
    websiteUrl: blankToNull(values.websiteUrl),
    tier:
      values.tier === 'none'
        ? null
        : (values.tier as (typeof SPONSOR_TIERS)[number]),
    activeSeasons: values.activeSeasons,
    displayOrder: Number.parseInt(values.displayOrder, 10),
  }
}

export function SponsorForm({
  draftKey,
  initialValues,
  seasons,
  submitLabel,
  onSubmit,
  serverError,
}: {
  draftKey: string
  initialValues: SponsorFormValues
  seasons: Array<{ slug: string; name: string }>
  submitLabel: string
  onSubmit: (values: ReturnType<typeof toSponsorSubmitValues>) => Promise<void>
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

  function set<K extends keyof SponsorFormValues>(
    field: K,
    value: SponsorFormValues[K],
  ) {
    setValues((current) => ({ ...current, [field]: value }))
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    setErrors({})

    const parsed = sponsorFormSchema.safeParse(toSponsorSubmitValues(values))

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
      if (!values.logo) fieldErrors.logo = 'Logo-ul este obligatoriu.'
      setErrors(fieldErrors)
      return
    }

    setSaving(true)
    try {
      await onSubmit(toSponsorSubmitValues(values))
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
          <Label htmlFor="sponsor-name">Nume</Label>
          <Input
            id="sponsor-name"
            value={values.name}
            onChange={(event) => set('name', event.target.value)}
            aria-invalid={errors.name ? true : undefined}
          />
          {errors.name ? (
            <p role="alert" className="text-destructive text-xs">
              {errors.name}
            </p>
          ) : null}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="sponsor-website">Site web (opțional)</Label>
          <Input
            id="sponsor-website"
            type="url"
            value={values.websiteUrl}
            onChange={(event) => set('websiteUrl', event.target.value)}
            aria-invalid={errors.websiteUrl ? true : undefined}
          />
          {errors.websiteUrl ? (
            <p role="alert" className="text-destructive text-xs">
              {errors.websiteUrl}
            </p>
          ) : null}
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="sponsor-tier">Nivel (opțional)</Label>
        <Select
          value={values.tier}
          onValueChange={(value) => set('tier', value)}
        >
          <SelectTrigger id="sponsor-tier">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">Fără nivel</SelectItem>
            {SPONSOR_TIERS.map((tier) => (
              <SelectItem key={tier} value={tier}>
                {TIER_LABELS[tier]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <ImageField
        label="Logo"
        required
        folder="sponsors"
        value={values.logo}
        onChange={(value) => set('logo', value)}
        hint="Se afișează pe zidul sponsorilor și pe pagina principală."
        error={errors.logo}
      />
      {errors.logo ? (
        <p role="alert" className="text-destructive text-xs">
          {errors.logo}
        </p>
      ) : null}

      <ImageField
        label="Logo pentru fundal închis (opțional)"
        folder="sponsors"
        value={values.logoDark}
        onChange={(value) => set('logoDark', value)}
        hint="Zidul sponsorilor stă pe fundal închis — încarcă o variantă dacă logo-ul principal nu se vede bine."
        error={errors.logoDark}
      />

      <BilingualField
        label="Descriere"
        multiline
        rows={3}
        ro={values.descriptionRo}
        en={values.descriptionEn}
        onRoChange={(v) => set('descriptionRo', v)}
        onEnChange={(v) => set('descriptionEn', v)}
      />

      <fieldset className="space-y-2">
        <legend className="text-sm font-medium">Sezoane susținute</legend>
        {seasons.length === 0 ? (
          <p className="text-muted-foreground text-xs">
            Încă niciun sezon. Adaugă sezoane întâi.
          </p>
        ) : (
          <div className="grid gap-2 sm:grid-cols-2">
            {seasons.map((s) => {
              const checked = values.activeSeasons.includes(s.slug)
              return (
                <div key={s.slug} className="flex items-center gap-2">
                  <Checkbox
                    id={`season-${s.slug}`}
                    checked={checked}
                    onCheckedChange={(next) =>
                      set(
                        'activeSeasons',
                        next
                          ? [...values.activeSeasons, s.slug]
                          : values.activeSeasons.filter((x) => x !== s.slug),
                      )
                    }
                  />
                  <Label htmlFor={`season-${s.slug}`} className="text-sm">
                    {s.name}
                  </Label>
                </div>
              )
            })}
          </div>
        )}
      </fieldset>

      <div className="flex items-center gap-3">
        <Button type="submit" disabled={saving}>
          {saving ? 'Se salvează…' : submitLabel}
        </Button>
        <Button asChild variant="outline">
          <Link to="/admin/sponsors">Renunță</Link>
        </Button>
      </div>
    </form>
  )
}
