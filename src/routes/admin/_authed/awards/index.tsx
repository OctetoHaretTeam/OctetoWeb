import { useState } from 'react'
import { createFileRoute, useRouter } from '@tanstack/react-router'

import { ConfirmDialog } from '@/components/admin/confirm-dialog'
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
import { awardFormSchema } from '@/lib/forms/entities'
import {
  adminCreateAward,
  adminDeleteAward,
  adminListAwards,
  adminListSeasons,
} from '@/server/admin/seasons'

/**
 * Awards — CLAUDE.md §10.
 *
 * Awards belong to a season, so they are managed as a flat list keyed to one:
 * §4 renders them from the season page and the home strip, never from a page
 * of their own.
 *
 * A duplicate is refused by the unique index added in §5, and the message says
 * so plainly — a duplicated Connect Award on this team's site is exactly the
 * kind of error a judge would notice.
 */
export const Route = createFileRoute('/admin/_authed/awards/')({
  loader: async () => {
    const [awards, seasons] = await Promise.all([
      adminListAwards(),
      adminListSeasons(),
    ])
    return { awards, seasons }
  },
  component: AdminAwards,
})

const EMPTY = {
  seasonId: '',
  nameRo: '',
  nameEn: '',
  eventName: '',
  eventDate: '',
  placement: '',
  isFeatured: false,
}

function AdminAwards() {
  const { awards, seasons } = Route.useLoaderData()
  const router = useRouter()
  const [values, setValues] = useState(EMPTY)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleCreate(event: React.FormEvent) {
    event.preventDefault()
    setErrors({})
    setError(null)

    const payload = {
      seasonId: values.seasonId,
      nameRo: values.nameRo.trim(),
      nameEn: values.nameEn.trim() || null,
      eventName: values.eventName.trim(),
      eventDate: values.eventDate.trim(),
      placement: values.placement.trim() || null,
      notesRo: null,
      notesEn: null,
      isFeatured: values.isFeatured,
    }

    const parsed = awardFormSchema.safeParse(payload)
    if (!parsed.success) {
      const fieldErrors: Record<string, string> = {}
      for (const issue of parsed.error.issues) {
        const key = issue.path[0]
        if (typeof key === 'string' && !fieldErrors[key]) {
          fieldErrors[key] = issue.message
        }
      }
      setErrors(fieldErrors)
      return
    }

    setBusy(true)
    try {
      const result = await adminCreateAward({ data: payload })
      if (!result.ok) {
        setError(
          'Există deja acest premiu pentru acel eveniment și sezon. Verifică lista de mai jos.',
        )
        return
      }
      setValues(EMPTY)
      await router.invalidate()
    } catch {
      setError('Premiul nu a putut fi salvat.')
    } finally {
      setBusy(false)
    }
  }

  async function handleDelete(id: string) {
    setBusy(true)
    setError(null)
    try {
      await adminDeleteAward({ data: { id } })
      await router.invalidate()
    } catch {
      setError('Premiul nu a putut fi șters.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">Premii</h2>
        <p className="text-muted-foreground text-sm">
          Apar pe pagina sezonului și în banda de pe pagina principală.
        </p>
      </div>

      {error ? (
        <p role="alert" className="text-destructive text-sm">
          {error}
        </p>
      ) : null}

      {seasons.length === 0 ? (
        <div className="border-border rounded-md border border-dashed p-6">
          <p className="font-medium">Adaugă întâi un sezon</p>
          <p className="text-muted-foreground mt-1 text-sm">
            Fiecare premiu aparține unui sezon.
          </p>
        </div>
      ) : (
        <form
          onSubmit={handleCreate}
          className="border-border grid gap-3 rounded-md border p-4 sm:grid-cols-2"
        >
          <div className="space-y-1.5">
            <Label htmlFor="award-season">Sezon</Label>
            <Select
              value={values.seasonId}
              onValueChange={(v) => setValues((c) => ({ ...c, seasonId: v }))}
            >
              <SelectTrigger id="award-season">
                <SelectValue placeholder="Alege sezonul" />
              </SelectTrigger>
              <SelectContent>
                {seasons.map((season) => (
                  <SelectItem key={season.id} value={season.id}>
                    {season.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.seasonId ? (
              <p role="alert" className="text-destructive text-xs">
                {errors.seasonId}
              </p>
            ) : null}
          </div>

          <Field id="award-name" label="Nume premiu (RO)" value={values.nameRo}
            error={errors.nameRo}
            onChange={(v) => setValues((c) => ({ ...c, nameRo: v }))} />
          <Field id="award-name-en" label="Nume premiu (EN, opțional)" value={values.nameEn}
            onChange={(v) => setValues((c) => ({ ...c, nameEn: v }))} />
          <Field id="award-event" label="Eveniment" value={values.eventName}
            error={errors.eventName}
            onChange={(v) => setValues((c) => ({ ...c, eventName: v }))} />
          <Field id="award-date" label="Data (AAAA-LL-ZZ)" value={values.eventDate}
            error={errors.eventDate}
            onChange={(v) => setValues((c) => ({ ...c, eventDate: v }))} />
          <Field id="award-placement" label="Loc (opțional)" value={values.placement}
            onChange={(v) => setValues((c) => ({ ...c, placement: v }))} />

          <div className="flex items-center gap-2 sm:col-span-2">
            <Checkbox
              id="award-featured"
              checked={values.isFeatured}
              onCheckedChange={(checked) =>
                setValues((c) => ({ ...c, isFeatured: checked === true }))
              }
            />
            <Label htmlFor="award-featured">
              Evidențiat pe pagina principală
            </Label>
          </div>

          <div className="sm:col-span-2">
            <Button type="submit" disabled={busy}>
              Adaugă premiu
            </Button>
          </div>
        </form>
      )}

      {awards.length === 0 ? (
        <div className="border-border rounded-md border border-dashed p-6">
          <p className="text-muted-foreground text-sm">Încă niciun premiu.</p>
        </div>
      ) : (
        <ul className="space-y-2">
          {awards.map((award) => (
            <li
              key={award.id}
              className="border-border flex flex-wrap items-center gap-x-3 gap-y-1 rounded-md border px-3 py-2"
            >
              <span className="font-medium">{award.nameRo}</span>
              <span className="text-muted-foreground text-sm">
                {award.eventName}
              </span>
              <span className="text-muted-foreground font-mono text-2xs">
                {award.eventDate} · {award.seasonName}
              </span>
              {award.placement ? (
                <span className="border-border rounded border px-1.5 py-0.5 font-mono text-2xs uppercase">
                  {award.placement}
                </span>
              ) : null}
              {award.isFeatured ? (
                <span className="border-border rounded border px-1.5 py-0.5 font-mono text-2xs uppercase">
                  evidențiat
                </span>
              ) : null}

              <ConfirmDialog
                trigger={
                  <button
                    type="button"
                    className="text-destructive ml-auto text-xs underline"
                  >
                    Șterge
                  </button>
                }
                title={`Ștergi „${award.nameRo}"?`}
                description="Premiul dispare de pe pagina sezonului și de pe pagina principală."
                confirmLabel="Șterge"
                disabled={busy}
                onConfirm={() => void handleDelete(award.id)}
              />
            </li>
          ))}
        </ul>
      )}
    </div>
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
