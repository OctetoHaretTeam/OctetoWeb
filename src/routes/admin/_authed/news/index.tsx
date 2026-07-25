import { useState } from 'react'
import { Link, createFileRoute, useRouter } from '@tanstack/react-router'

import { ConfirmDialog } from '@/components/admin/confirm-dialog'
import { Button } from '@/components/ui/button'
import {
  adminDeleteNews,
  adminListNews,
  adminSetNewsPublished,
} from '@/server/admin/news'

/**
 * News list — CLAUDE.md §10.
 *
 * Drafts and published posts sit in one list distinguished by a badge, so what
 * is live is obvious at a glance. Publishing is an explicit action here rather
 * than a field buried in the editor, and the button says what it does ("Publică").
 */
export const Route = createFileRoute('/admin/_authed/news/')({
  loader: () => adminListNews(),
  component: AdminNewsList,
})

function AdminNewsList() {
  const posts = Route.useLoaderData()
  const router = useRouter()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function run(action: () => Promise<unknown>, failureMessage: string) {
    setBusy(true)
    setError(null)
    try {
      await action()
      await router.invalidate()
    } catch {
      setError(failureMessage)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold">Noutăți</h2>
          <p className="text-muted-foreground text-sm">
            Ciornele nu apar pe site până nu le publici.
          </p>
        </div>
        <Button asChild>
          <Link to="/admin/news/new">Scrie o noutate</Link>
        </Button>
      </div>

      {error ? (
        <p role="alert" className="text-destructive text-sm">
          {error}
        </p>
      ) : null}

      {posts.length === 0 ? (
        <div className="border-border rounded-md border border-dashed p-6">
          <p className="font-medium">Încă nicio noutate</p>
          <p className="text-muted-foreground mt-1 text-sm">
            Prima noutate apare pe pagina principală imediat ce o publici.
          </p>
        </div>
      ) : (
        <ul className="space-y-2">
          {posts.map((post) => {
            const published = post.publishedAt !== null

            return (
              <li
                key={post.slug}
                className="border-border flex flex-wrap items-center gap-x-3 gap-y-2 rounded-md border px-3 py-2"
              >
                <Link
                  to="/admin/news/$slug"
                  params={{ slug: post.slug }}
                  className="font-medium"
                >
                  {post.titleRo}
                </Link>

                <Badge>{published ? 'publicat' : 'ciornă'}</Badge>
                {!post.titleEn ? <Badge>fără EN</Badge> : null}

                <div className="ml-auto flex items-center gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={busy}
                    onClick={() =>
                      void run(
                        () =>
                          adminSetNewsPublished({
                            data: { slug: post.slug, published: !published },
                          }),
                        'Starea nu a putut fi schimbată.',
                      )
                    }
                  >
                    {published ? 'Retrage' : 'Publică'}
                  </Button>

                  <ConfirmDialog
                    trigger={
                      <button
                        type="button"
                        className="text-destructive text-xs underline"
                      >
                        Șterge
                      </button>
                    }
                    title={`Ștergi ${post.titleRo}?`}
                    description="Noutatea dispare de pe site. Acțiunea nu poate fi anulată."
                    confirmLabel="Șterge"
                    disabled={busy}
                    onConfirm={() =>
                      void run(
                        () => adminDeleteNews({ data: { slug: post.slug } }),
                        'Noutatea nu a putut fi ștearsă.',
                      )
                    }
                  />
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}

function Badge({ children }: { children: string }) {
  return (
    <span className="border-border text-muted-foreground rounded border px-1.5 py-0.5 font-mono text-2xs uppercase">
      {children}
    </span>
  )
}
