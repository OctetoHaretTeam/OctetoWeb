import { useState } from 'react'
import { Link, createFileRoute, useRouter } from '@tanstack/react-router'

import { ConfirmDialog } from '@/components/admin/confirm-dialog'
import { Button } from '@/components/ui/button'
import { adminDeleteSeason, adminListSeasons } from '@/server/admin/seasons'

export const Route = createFileRoute('/admin/_authed/seasons/')({
  loader: () => adminListSeasons(),
  component: AdminSeasonList,
})

function AdminSeasonList() {
  const seasons = Route.useLoaderData()
  const router = useRouter()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleDelete(slug: string) {
    setBusy(true)
    setError(null)
    try {
      const result = await adminDeleteSeason({ data: { slug } })
      if (!result.ok) {
        setError(
          result.error === 'has-awards'
            ? 'Sezonul are premii legate de el. Șterge sau mută întâi premiile — istoricul premiilor nu se pierde din greșeală.'
            : 'Sezonul nu a putut fi șters.',
        )
        return
      }
      await router.invalidate()
    } catch {
      setError('Sezonul nu a putut fi șters.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold">Sezoane</h2>
          <p className="text-muted-foreground text-sm">
            Arhiva pe care o caută jurații.
          </p>
        </div>
        <Button asChild>
          <Link to="/admin/seasons/new">Adaugă sezon</Link>
        </Button>
      </div>

      {error ? (
        <p role="alert" className="text-destructive text-sm">
          {error}
        </p>
      ) : null}

      {seasons.length === 0 ? (
        <div className="border-border rounded-md border border-dashed p-6">
          <p className="font-medium">Încă niciun sezon</p>
          <p className="text-muted-foreground mt-1 text-sm">
            Adaugă un sezon ca să poți lega premii și realizări de el.
          </p>
        </div>
      ) : (
        <ul className="space-y-2">
          {seasons.map((s) => (
            <li
              key={s.slug}
              className="border-border flex flex-wrap items-center gap-x-3 gap-y-2 rounded-md border px-3 py-2"
            >
              <Link
                to="/admin/seasons/$slug"
                params={{ slug: s.slug }}
                className="font-medium"
              >
                {s.name}
              </Link>
              <span className="text-muted-foreground text-sm">{s.gameName}</span>
              <span className="text-muted-foreground font-mono text-2xs">
                {s.startDate} → {s.endDate ?? 'în desfășurare'}
              </span>
              {s.isCurrent ? (
                <span className="border-border rounded border px-1.5 py-0.5 font-mono text-2xs uppercase">
                  curent
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
                title={`Ștergi sezonul ${s.name}?`}
                description="Sezonul dispare din arhivă. Dacă are premii legate, ștergerea este refuzată."
                confirmLabel="Șterge"
                disabled={busy}
                onConfirm={() => void handleDelete(s.slug)}
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
