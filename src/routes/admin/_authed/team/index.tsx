import { useState } from 'react'
import { Link, createFileRoute, useRouter } from '@tanstack/react-router'

import { ConfirmDialog } from '@/components/admin/confirm-dialog'
import { ReorderList } from '@/components/admin/reorder-list'
import { Button } from '@/components/ui/button'
import {
  type AdminTeamMember,
  adminDeleteTeamMember,
  adminListTeamMembers,
  adminReorderTeamMembers,
} from '@/server/admin/team'

/**
 * Team list — CLAUDE.md §10. Romanian-only (§11).
 *
 * Shows inactive members too, which the public roster hides, and surfaces the
 * two consent flags in the list rather than only inside the editor: whether a
 * minor's photo and surname are public is the thing most worth being able to
 * check at a glance (§8).
 */
export const Route = createFileRoute('/admin/_authed/team/')({
  loader: () => adminListTeamMembers(),
  component: AdminTeamList,
})

const BRANCH_LABELS: Record<AdminTeamMember['branch'], string> = {
  tech: 'Tehnic',
  non_tech: 'Non-tehnic',
  mentor: 'Mentor',
  volunteer: 'Voluntar',
}

function AdminTeamList() {
  const loaded = Route.useLoaderData()
  const router = useRouter()
  const [members, setMembers] = useState(loaded)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleReorder(slugs: string[]) {
    // Optimistic: the list rearranges immediately, then persists.
    const bySlug = new Map(members.map((m) => [m.slug, m]))
    const reordered = slugs
      .map((slug) => bySlug.get(slug))
      .filter((m): m is AdminTeamMember => Boolean(m))

    const previous = members
    setMembers(reordered)
    setBusy(true)
    setError(null)

    try {
      await adminReorderTeamMembers({ data: { slugs } })
      await router.invalidate()
    } catch {
      setMembers(previous)
      setError('Ordinea nu a putut fi salvată. Încearcă din nou.')
    } finally {
      setBusy(false)
    }
  }

  async function handleDelete(slug: string) {
    setBusy(true)
    setError(null)

    try {
      await adminDeleteTeamMember({ data: { slug } })
      setMembers((current) => current.filter((m) => m.slug !== slug))
      await router.invalidate()
    } catch {
      setError('Membrul nu a putut fi șters. Încearcă din nou.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold">Echipă</h2>
          <p className="text-muted-foreground text-sm">
            Ordinea de aici este ordinea de pe pagina publică.
          </p>
        </div>
        <Button asChild>
          <Link to="/admin/team/new">Adaugă membru</Link>
        </Button>
      </div>

      {error ? (
        <p role="alert" className="text-destructive text-sm">
          {error}
        </p>
      ) : null}

      {members.length === 0 ? (
        <div className="border-border rounded-md border border-dashed p-6">
          <p className="font-medium">Încă niciun membru</p>
          <p className="text-muted-foreground mt-1 text-sm">
            Adaugă primul membru ca să apară pe pagina echipei.
          </p>
        </div>
      ) : (
        <ReorderList
          items={members}
          disabled={busy}
          getKey={(member) => member.slug}
          getLabel={(member) => member.name}
          onReorder={handleReorder}
          renderItem={(member) => (
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
              <Link
                to="/admin/team/$slug"
                params={{ slug: member.slug }}
                className="font-medium"
              >
                {member.name}
              </Link>

              <span className="text-muted-foreground font-mono text-2xs uppercase">
                {BRANCH_LABELS[member.branch]}
              </span>

              {!member.isActive ? <Flag>inactiv</Flag> : null}
              {!member.photoConsent ? <Flag>fără foto</Flag> : null}
              {!member.fullNamePublic ? <Flag>nume parțial</Flag> : null}

              <ConfirmDialog
                trigger={
                  <button
                    type="button"
                    className="text-destructive ml-auto text-xs underline"
                  >
                    Șterge
                  </button>
                }
                title={`Ștergi ${member.name}?`}
                description="Profilul dispare de pe site, iar codul QR de pe tricou nu mai duce nicăieri. Acțiunea nu poate fi anulată."
                confirmLabel="Șterge"
                disabled={busy}
                onConfirm={() => void handleDelete(member.slug)}
              />
            </div>
          )}
        />
      )}
    </div>
  )
}

function Flag({ children }: { children: string }) {
  return (
    <span className="border-border text-muted-foreground rounded border px-1.5 py-0.5 font-mono text-2xs uppercase">
      {children}
    </span>
  )
}
