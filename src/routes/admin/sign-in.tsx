import { createFileRoute, redirect } from '@tanstack/react-router'
import { z } from 'zod'

import { getAdminSession } from '@/server/auth'

/**
 * Admin sign-in — CLAUDE.md §9. Romanian-only (§11).
 *
 * There is no form, no password field and no "create account" link, because
 * there are no accounts: the only way in is a Google address that appears in
 * `ALLOWED_ADMIN_EMAILS`.
 *
 * The page deliberately does not say who is allowed, and a refused sign-in
 * returns a bare 403 from the callback — nothing here reveals whether a given
 * address is an administrator.
 */
const searchSchema = z.object({
  returnTo: z.string().optional(),
  error: z.enum(['cancelled']).optional(),
})

export const Route = createFileRoute('/admin/sign-in')({
  validateSearch: searchSchema,
  beforeLoad: async ({ search }) => {
    // Already signed in — no reason to show this page.
    const admin = await getAdminSession()
    if (admin) {
      throw redirect({ to: search.returnTo ?? '/admin' })
    }
  },
  component: SignIn,
})

function SignIn() {
  const { returnTo, error } = Route.useSearch()

  const href = returnTo
    ? `/api/auth/google?returnTo=${encodeURIComponent(returnTo)}`
    : '/api/auth/google'

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center gap-6 px-4">
      <div className="space-y-2">
        <p className="font-mono text-2xs uppercase text-muted-foreground">
          OctetoHaret · FTC 25474
        </p>
        <h1 className="text-2xl font-semibold">Administrare</h1>
        <p className="text-muted-foreground text-sm">
          Intră cu contul Google al echipei. Accesul este limitat la adresele
          aprobate.
        </p>
      </div>

      {error === 'cancelled' ? (
        <p
          role="status"
          className="border-border text-muted-foreground rounded-md border px-3 py-2 text-sm"
        >
          Autentificarea a fost anulată. Încearcă din nou.
        </p>
      ) : null}

      {/*
        A real link, not a button with an onClick: sign-in has to work before
        hydration, and the server route it points at only redirects.
      */}
      <a
        href={href}
        className="bg-primary text-primary-foreground rounded-md px-4 py-2 text-center text-sm font-semibold no-underline"
      >
        Continuă cu Google
      </a>

      <p className="text-muted-foreground text-xs">
        Nu se creează niciun cont. Site-ul nu păstrează parole.
      </p>
    </main>
  )
}
