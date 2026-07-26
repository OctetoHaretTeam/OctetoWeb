import { useState } from 'react'
import { createFileRoute, useRouter } from '@tanstack/react-router'

import { BilingualField } from '@/components/admin/bilingual-field'
import { GalleryField } from '@/components/admin/gallery-field'
import { useDraftAutosave } from '@/components/admin/use-draft-autosave'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { teamInfoFormSchema } from '@/lib/forms/entities'
import type { ImageAsset } from '@/lib/schemas'
import { adminGetTeamInfo, adminSaveTeamInfo } from '@/server/admin/misc'

/**
 * Team info — the §5 singleton behind /about.
 *
 * Social links are a closed shape (§5), so a typo is a validation error rather
 * than a dead icon on the public page.
 */
export const Route = createFileRoute('/admin/_authed/info/')({
  loader: () => adminGetTeamInfo(),
  component: AdminInfo,
})

const SOCIAL_FIELDS = [
  ['instagram', 'Instagram'],
  ['tiktok', 'TikTok'],
  ['facebook', 'Facebook'],
  ['youtube', 'YouTube'],
  ['github', 'GitHub'],
  ['instagramFll', 'Instagram · FLL'],
] as const

type SocialKey = (typeof SOCIAL_FIELDS)[number][0]

function AdminInfo() {
  const info = Route.useLoaderData()
  const router = useRouter()
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const [values, setValues] = useState({
    originStoryRo: info?.originStoryRo ?? '',
    originStoryEn: info?.originStoryEn ?? '',
    gallery: (info?.gallery ?? []) as ImageAsset[],
    foundedDate: info?.foundedDate ?? '',
    schoolName: info?.schoolName ?? '',
    city: info?.city ?? '',
    country: info?.country ?? 'MD',
    contactEmail: info?.contactEmail ?? '',
    phone: info?.phone ?? '',
    social: Object.fromEntries(
      SOCIAL_FIELDS.map(([key]) => [key, info?.socialLinks?.[key] ?? '']),
    ) as Record<SocialKey, string>,
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  const draft = useDraftAutosave({
    key: 'team-info',
    values,
    onRestore: setValues,
  })

  function set<K extends keyof typeof values>(
    field: K,
    value: (typeof values)[K],
  ) {
    setValues((current) => ({ ...current, [field]: value }))
    setSaved(false)
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    setErrors({})
    setError(null)

    const payload = {
      originStoryRo: values.originStoryRo.trim(),
      originStoryEn: values.originStoryEn.trim() || null,
      gallery: values.gallery,
      foundedDate: values.foundedDate.trim(),
      schoolName: values.schoolName.trim(),
      city: values.city.trim(),
      country: values.country.trim().toUpperCase(),
      contactEmail: values.contactEmail.trim(),
      phone: values.phone.trim() || null,
      // Empty strings are dropped rather than stored as blank URLs.
      socialLinks: Object.fromEntries(
        Object.entries(values.social)
          .filter(([, url]) => url.trim().length > 0)
          .map(([key, url]) => [key, url.trim()]),
      ),
      mapEmbedLat: info?.mapEmbedLat ?? null,
      mapEmbedLng: info?.mapEmbedLng ?? null,
    }

    const parsed = teamInfoFormSchema.safeParse(payload)
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

    setBusy(true)
    try {
      await adminSaveTeamInfo({ data: payload })
      draft.clear()
      setSaved(true)
      await router.invalidate()
    } catch {
      setError('Informațiile nu au putut fi salvate.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-3xl space-y-8">
      <div>
        <h2 className="text-xl font-semibold">Informații</h2>
        <p className="text-muted-foreground text-sm">
          Alimentează pagina „Despre" și datele de contact.
        </p>
      </div>

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

      {error ? (
        <p role="alert" className="text-destructive text-sm">
          {error}
        </p>
      ) : null}
      {saved ? (
        <p role="status" className="text-sm">
          Informațiile au fost salvate.
        </p>
      ) : null}

      <BilingualField
        label="Povestea echipei (Markdown)"
        required
        multiline
        rows={10}
        ro={values.originStoryRo}
        en={values.originStoryEn}
        onRoChange={(v) => set('originStoryRo', v)}
        onEnChange={(v) => set('originStoryEn', v)}
        error={errors.originStoryRo}
      />

      <div className="grid gap-3 sm:grid-cols-2">
        <Field id="info-school" label="Școala" value={values.schoolName}
          error={errors.schoolName} onChange={(v) => set('schoolName', v)} />
        <Field id="info-city" label="Oraș" value={values.city}
          error={errors.city} onChange={(v) => set('city', v)} />
        <Field id="info-country" label="Țară (cod din 2 litere)" value={values.country}
          error={errors.country} onChange={(v) => set('country', v)} />
        <Field id="info-founded" label="Fondată la (AAAA-LL-ZZ)" value={values.foundedDate}
          error={errors.foundedDate} onChange={(v) => set('foundedDate', v)} />
        <Field id="info-email" label="Email de contact" value={values.contactEmail}
          error={errors.contactEmail} onChange={(v) => set('contactEmail', v)} />
        <Field id="info-phone" label="Telefon (opțional)" value={values.phone}
          error={errors.phone} onChange={(v) => set('phone', v)} />
      </div>

      <fieldset className="space-y-3">
        <legend className="text-sm font-medium">Rețele sociale</legend>
        <div className="grid gap-3 sm:grid-cols-2">
          {SOCIAL_FIELDS.map(([key, label]) => (
            <Field
              key={key}
              id={`social-${key}`}
              label={label}
              value={values.social[key]}
              error={errors[`socialLinks.${key}`]}
              onChange={(v) =>
                set('social', { ...values.social, [key]: v })
              }
            />
          ))}
        </div>
      </fieldset>

      <GalleryField
        label="Galerie"
        folder="about"
        max={10}
        value={values.gallery}
        onChange={(v) => set('gallery', v)}
        error={errors.gallery}
      />

      <Button type="submit" disabled={busy}>
        {busy ? 'Se salvează…' : 'Salvează'}
      </Button>
    </form>
  )
}

function Field({
  id,
  label,
  value,
  error,
  onChange,
}: {
  id: string
  label: string
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
      {error ? (
        <p role="alert" className="text-destructive text-xs">
          {error}
        </p>
      ) : null}
    </div>
  )
}
