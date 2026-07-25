import { useState } from 'react'
import { Link } from '@tanstack/react-router'

import { BilingualField } from '@/components/admin/bilingual-field'
import { ImageField } from '@/components/admin/image-field'
import { useDraftAutosave } from '@/components/admin/use-draft-autosave'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  teamMemberFormSchema,
  type TeamMemberFormInput,
} from '@/lib/forms/team-member'
import type { ImageAsset } from '@/lib/schemas'

/**
 * The team member editor — CLAUDE.md §10. Romanian-only (§11).
 *
 * Bilingual fields sit side by side in one form with English marked optional,
 * a local draft is kept so a lost tab does not lose the work, and the two
 * consent switches are given their own section with the consequence spelled
 * out — they decide whether a 14-to-18-year-old's photograph and surname
 * appear in public (§8), which is not something to bury among other toggles.
 *
 * Validation here is for the person typing. The server validates again and is
 * the source of truth (§10).
 */

export type MemberFormValues = {
  slug: string
  name: string
  roleRo: string
  roleEn: string
  branch: TeamMemberFormInput['branch']
  descriptionRo: string
  descriptionEn: string
  instagramUrl: string
  image: ImageAsset | null
  octetIndex: string
  displayOrder: string
  isActive: boolean
  photoConsent: boolean
  fullNamePublic: boolean
}

const BRANCH_OPTIONS: Array<{ value: MemberFormValues['branch']; label: string }> =
  [
    { value: 'tech', label: 'Tehnic' },
    { value: 'non_tech', label: 'Non-tehnic' },
    { value: 'mentor', label: 'Mentor' },
    { value: 'volunteer', label: 'Voluntar' },
  ]

export function emptyMemberForm(displayOrder: number): MemberFormValues {
  return {
    slug: '',
    name: '',
    roleRo: '',
    roleEn: '',
    branch: 'tech',
    descriptionRo: '',
    descriptionEn: '',
    instagramUrl: '',
    image: null,
    octetIndex: '0',
    displayOrder: String(displayOrder),
    isActive: true,
    // Both default to false, exactly as the column does (§8).
    photoConsent: false,
    fullNamePublic: false,
  }
}

/** Empty strings become null, because §5 distinguishes "absent" from "blank". */
function blankToNull(value: string): string | null {
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : null
}

export function toSubmitValues(values: MemberFormValues) {
  return {
    slug: values.slug.trim(),
    name: values.name.trim(),
    roleRo: values.roleRo.trim(),
    roleEn: blankToNull(values.roleEn),
    branch: values.branch,
    descriptionRo: blankToNull(values.descriptionRo),
    descriptionEn: blankToNull(values.descriptionEn),
    instagramUrl: blankToNull(values.instagramUrl),
    octetIndex: Number.parseInt(values.octetIndex, 10),
    displayOrder: Number.parseInt(values.displayOrder, 10),
    isActive: values.isActive,
    photoConsent: values.photoConsent,
    fullNamePublic: values.fullNamePublic,
    image: values.image,
  }
}

export function MemberForm({
  draftKey,
  initialValues,
  submitLabel,
  onSubmit,
  serverError,
}: {
  draftKey: string
  initialValues: MemberFormValues
  submitLabel: string
  onSubmit: (values: ReturnType<typeof toSubmitValues>) => Promise<void>
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

  function set<K extends keyof MemberFormValues>(
    field: K,
    value: MemberFormValues[K],
  ) {
    setValues((current) => ({ ...current, [field]: value }))
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    setErrors({})

    const parsed = teamMemberFormSchema.safeParse(toSubmitValues(values))

    if (!parsed.success) {
      const fieldErrors: Record<string, string> = {}
      for (const issue of parsed.error.issues) {
        const field = issue.path[0]
        if (typeof field === 'string' && !fieldErrors[field]) {
          fieldErrors[field] = issue.message
        }
      }
      setErrors(fieldErrors)
      return
    }

    setSaving(true)
    try {
      await onSubmit(toSubmitValues(values))
      // Only clear the draft once the save actually succeeded.
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

      <section className="space-y-4">
        <h3 className="text-sm font-semibold">Identitate</h3>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="member-name">Nume complet</Label>
            <Input
              id="member-name"
              value={values.name}
              onChange={(event) => set('name', event.target.value)}
              aria-invalid={errors.name ? true : undefined}
            />
            <p className="text-muted-foreground text-xs">
              Se păstrează întreg aici. Ce se afișează public depinde de
              comutatorul de mai jos.
            </p>
            {errors.name ? (
              <p role="alert" className="text-destructive text-xs">
                {errors.name}
              </p>
            ) : null}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="member-slug">Slug</Label>
            <Input
              id="member-slug"
              value={values.slug}
              onChange={(event) => set('slug', event.target.value)}
              aria-invalid={errors.slug ? true : undefined}
            />
            <p className="text-muted-foreground text-xs">
              Se tipărește pe tricou și în codul QR. Nu îl schimba după ce ai
              comandat merch.
            </p>
            {errors.slug ? (
              <p role="alert" className="text-destructive text-xs">
                {errors.slug}
              </p>
            ) : null}
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="member-branch">Ramură</Label>
            <Select
              value={values.branch}
              onValueChange={(value) =>
                set('branch', value as MemberFormValues['branch'])
              }
            >
              <SelectTrigger id="member-branch">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {BRANCH_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="member-octet">Index octet (0–255)</Label>
            <Input
              id="member-octet"
              type="number"
              min={0}
              max={255}
              value={values.octetIndex}
              onChange={(event) => set('octetIndex', event.target.value)}
              aria-invalid={errors.octetIndex ? true : undefined}
            />
            {errors.octetIndex ? (
              <p role="alert" className="text-destructive text-xs">
                {errors.octetIndex}
              </p>
            ) : null}
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <h3 className="text-sm font-semibold">Conținut</h3>

        <BilingualField
          label="Rol"
          required
          ro={values.roleRo}
          en={values.roleEn}
          onRoChange={(v) => set('roleRo', v)}
          onEnChange={(v) => set('roleEn', v)}
          error={errors.roleRo}
        />

        <BilingualField
          label="Descriere"
          multiline
          ro={values.descriptionRo}
          en={values.descriptionEn}
          onRoChange={(v) => set('descriptionRo', v)}
          onEnChange={(v) => set('descriptionEn', v)}
          hint="Dacă engleza lipsește, site-ul arată textul român cu o notă discretă."
        />

        <div className="space-y-1.5">
          <Label htmlFor="member-instagram">Instagram (opțional)</Label>
          <Input
            id="member-instagram"
            type="url"
            placeholder="https://instagram.com/…"
            value={values.instagramUrl}
            onChange={(event) => set('instagramUrl', event.target.value)}
            aria-invalid={errors.instagramUrl ? true : undefined}
          />
          {errors.instagramUrl ? (
            <p role="alert" className="text-destructive text-xs">
              {errors.instagramUrl}
            </p>
          ) : null}
        </div>

        <ImageField
          label="Fotografie"
          folder="team"
          value={values.image}
          onChange={(value) => set('image', value)}
          hint="Nu se afișează public decât dacă acordul de mai jos este pornit. Datele EXIF se elimină automat."
        />
      </section>

      <section className="space-y-3">
        <div>
          <h3 className="text-sm font-semibold">Consimțământ</h3>
          <p className="text-muted-foreground text-xs">
            Membrii au între 14 și 18 ani. Ambele opțiuni sunt oprite implicit
            și se activează doar cu acordul membrului.
          </p>
        </div>

        <ConsentSwitch
          id="member-photo-consent"
          checked={values.photoConsent}
          onChange={(v) => set('photoConsent', v)}
          label="Fotografia poate fi publică"
          description="Oprit: se afișează avatarul-substituent, chiar dacă există o fotografie."
        />

        <ConsentSwitch
          id="member-name-consent"
          checked={values.fullNamePublic}
          onChange={(v) => set('fullNamePublic', v)}
          label="Numele complet poate fi public"
          description="Oprit: se afișează prenumele și inițiala, inclusiv în titlul paginii și în etichetele og:."
        />

        <ConsentSwitch
          id="member-active"
          checked={values.isActive}
          onChange={(v) => set('isActive', v)}
          label="Membru activ"
          description="Oprit: nu apare pe pagina publică a echipei."
        />
      </section>

      <div className="flex items-center gap-3">
        <Button type="submit" disabled={saving}>
          {saving ? 'Se salvează…' : submitLabel}
        </Button>
        <Button asChild variant="outline">
          <Link to="/admin/team">Renunță</Link>
        </Button>
      </div>
    </form>
  )
}

function ConsentSwitch({
  id,
  checked,
  onChange,
  label,
  description,
}: {
  id: string
  checked: boolean
  onChange: (value: boolean) => void
  label: string
  description: string
}) {
  return (
    <div className="border-border flex items-start gap-3 rounded-md border px-3 py-3">
      <Switch
        id={id}
        checked={checked}
        onCheckedChange={onChange}
        aria-describedby={`${id}-description`}
      />
      <div className="space-y-0.5">
        <Label htmlFor={id}>{label}</Label>
        <p id={`${id}-description`} className="text-muted-foreground text-xs">
          {description}
        </p>
      </div>
    </div>
  )
}
