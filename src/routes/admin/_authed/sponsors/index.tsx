import { useState } from 'react'
import { Link, createFileRoute, useRouter } from '@tanstack/react-router'

import { ConfirmDialog } from '@/components/admin/confirm-dialog'
import { ReorderList } from '@/components/admin/reorder-list'
import { Button } from '@/components/ui/button'
import {
  type AdminSponsor,
  adminDeleteSponsor,
  adminListSponsors,
  adminReorderSponsors,
} from '@/server/admin/sponsors'

/** Sponsor wall order — CLAUDE.md §10. */
export const Route = createFileRoute('/admin/_authed/sponsors/')({
  loader: () => adminListSponsors(),
  component: AdminSponsorList,
})

const TIER_LABELS: Record<string, string> = {
  platinum: 'Platină',
  gold: 'Aur',
  silver: 'Argint',
  partner: 'Partener',
  in_kind: 'În natură',
}

function AdminSponsorList() {
  const loaded = Route.useLoaderData()
  const router = useRouter()
  const [sponsors, setSponsors] = useState(loaded)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleReorder(ids: string[]) {
    const byId = new Map(sponsors.map((s) => [s.id, s]))
    const reordered = ids
      .map((id) => byId.get(id))
      .filter((s): s is AdminSponsor => Boolean(s))

    const previous = sponsors
    setSponsors(reordered)
    setBusy(true)
    setError(null)

    try {
      await adminReorderSponsors({ data: { ids } })
      await router.invalidate()
    } catch {
      setSponsors(previous)
      setError('Ordinea nu a putut fi salvată.')
    } finally {
      setBusy(false)
    }
  }

  async function handleDelete(id: string) {
    setBusy(true)
    setError(null)
    try {
      await adminDeleteSponsor({ data: { id } })
      setSponsors((current) => current.filter((s) => s.id !== id))
      await router.invalidate()
    } catch {
      setError('Sponsorul nu a putut fi șters.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold">Sponsori</h2>
          <p className="text-muted-foreground text-sm">
            Ordinea de aici este ordinea de pe zidul sponsorilor.
          </p>
        </div>
        <Button asChild>
          <Link to="/admin/sponsors/new">Adaugă sponsor</Link>
        </Button>
      </div>

      {error ? (
        <p role="alert" className="text-destructive text-sm">
          {error}
        </p>
      ) : null}

      {sponsors.length === 0 ? (
        <div className="border-border rounded-md border border-dashed p-6">
          <p className="font-medium">Încă niciun sponsor</p>
          <p className="text-muted-foreground mt-1 text-sm">
            Adaugă primul sponsor ca să apară pe pagina principală.
          </p>
        </div>
      ) : (
        <ReorderList
          items={sponsors}
          disabled={busy}
          getKey={(s) => s.id}
          getLabel={(s) => s.name}
          onReorder={handleReorder}
          renderItem={(s) => (
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
              <Link
                to="/admin/sponsors/$id"
                params={{ id: s.id }}
                className="font-medium"
              >
                {s.name}
              </Link>

              {s.tier ? (
                <span className="border-border text-muted-foreground rounded border px-1.5 py-0.5 font-mono text-2xs uppercase">
                  {TIER_LABELS[s.tier] ?? s.tier}
                </span>
              ) : null}

              {s.activeSeasons.length > 0 ? (
                <span className="text-muted-foreground text-xs">
                  {s.activeSeasons.length} sezoane
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
                title={`Ștergi ${s.name}?`}
                description="Sponsorul dispare de pe site. Acțiunea nu poate fi anulată."
                confirmLabel="Șterge"
                disabled={busy}
                onConfirm={() => void handleDelete(s.id)}
              />
            </div>
          )}
        />
      )}
    </div>
  )
}
