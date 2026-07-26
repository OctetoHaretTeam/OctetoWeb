import { useState } from 'react'
import { Link, createFileRoute, useRouter } from '@tanstack/react-router'

import { ConfirmDialog } from '@/components/admin/confirm-dialog'
import { ReorderList } from '@/components/admin/reorder-list'
import { Button } from '@/components/ui/button'
import {
  type AdminPerformanceItem,
  adminDeletePerformance,
  adminListPerformance,
  adminReorderPerformance,
} from '@/server/admin/performance'

export const Route = createFileRoute('/admin/_authed/performance/')({
  loader: () => adminListPerformance(),
  component: AdminPerformanceList,
})

const BRANCH_LABELS: Record<string, string> = {
  tech: 'Tehnic',
  non_tech: 'Non-tehnic',
}

function AdminPerformanceList() {
  const loaded = Route.useLoaderData()
  const router = useRouter()
  const [entries, setEntries] = useState(loaded)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleReorder(slugs: string[]) {
    const bySlug = new Map(entries.map((e) => [e.slug, e]))
    const next = slugs
      .map((slug) => bySlug.get(slug))
      .filter((e): e is AdminPerformanceItem => Boolean(e))

    const previous = entries
    setEntries(next)
    setBusy(true)
    try {
      await adminReorderPerformance({ data: { slugs } })
      await router.invalidate()
    } catch {
      setEntries(previous)
      setError('Ordinea nu a putut fi salvată.')
    } finally {
      setBusy(false)
    }
  }

  async function handleDelete(slug: string) {
    setBusy(true)
    setError(null)
    try {
      await adminDeletePerformance({ data: { slug } })
      setEntries((current) => current.filter((e) => e.slug !== slug))
      await router.invalidate()
    } catch {
      setError('Intrarea nu a putut fi ștearsă.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold">Realizări</h2>
          <p className="text-muted-foreground text-sm">
            Ordinea de aici este ordinea de pe paginile publice.
          </p>
        </div>
        <Button asChild>
          <Link to="/admin/performance/new">Adaugă realizare</Link>
        </Button>
      </div>

      {error ? (
        <p role="alert" className="text-destructive text-sm">
          {error}
        </p>
      ) : null}

      {entries.length === 0 ? (
        <div className="border-border rounded-md border border-dashed p-6">
          <p className="font-medium">Încă nicio realizare</p>
          <p className="text-muted-foreground mt-1 text-sm">
            Adaugă prima intrare ca să apară pe /performance.
          </p>
        </div>
      ) : (
        <ReorderList
          items={entries}
          disabled={busy}
          getKey={(e) => e.slug}
          getLabel={(e) => e.titleRo}
          onReorder={handleReorder}
          renderItem={(entry) => (
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
              <Link
                to="/admin/performance/$slug"
                params={{ slug: entry.slug }}
                className="font-medium"
              >
                {entry.titleRo}
              </Link>
              <span className="text-muted-foreground font-mono text-2xs uppercase">
                {BRANCH_LABELS[entry.branch]} · {entry.category}
              </span>
              <span className="text-muted-foreground font-mono text-2xs">
                {entry.date}
              </span>
              {!entry.titleEn ? (
                <span className="border-border text-muted-foreground rounded border px-1.5 py-0.5 font-mono text-2xs uppercase">
                  fără EN
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
                title={`Ștergi ${entry.titleRo}?`}
                description="Intrarea dispare de pe site. Acțiunea nu poate fi anulată."
                confirmLabel="Șterge"
                disabled={busy}
                onConfirm={() => void handleDelete(entry.slug)}
              />
            </div>
          )}
        />
      )}
    </div>
  )
}
