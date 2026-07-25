import { Link, Outlet, createFileRoute, redirect } from '@tanstack/react-router'

import { getAdminSession } from '@/server/auth'

/**
 * The authenticated admin area — CLAUDE.md §9.
 *
 * Pathless, so children keep their `/admin/...` URLs while sign-in stays
 * outside the guard.
 *
 * This guard exists for user experience: it stops an unauthenticated person
 * loading a screen that would fail anyway. **It is not the security boundary.**
 * Every server function behind these screens re-verifies with
 * `adminMiddleware`, because an endpoint can be called without ever loading
 * the route that normally calls it.
 */
export const Route = createFileRoute('/admin/_authed')({
  beforeLoad: async ({ location }) => {
    const admin = await getAdminSession()

    if (!admin) {
      throw redirect({
        to: '/admin/sign-in',
        search: { returnTo: location.pathname },
      })
    }

    return { admin }
  },
  component: AuthedLayout,
})

const NAV = [
  { to: '/admin', label: 'Panou' },
  { to: '/admin/team', label: 'Echipă' },
  { to: '/admin/news', label: 'Noutăți' },
  { to: '/admin/seasons', label: 'Sezoane' },
  { to: '/admin/sponsors', label: 'Sponsori' },
  { to: '/admin/qr-codes', label: 'Coduri QR' },
] as const

function AuthedLayout() {
  const { admin } = Route.useRouteContext()

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6">
      <header className="border-border flex flex-wrap items-center justify-between gap-4 border-b pb-4">
        <div>
          <p className="font-mono text-2xs uppercase text-muted-foreground">
            OctetoHaret
          </p>
          <p className="text-lg font-semibold">Administrare</p>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-muted-foreground text-sm">{admin.email}</span>
          {/*
            A real form POST, not a fetch: sign-out must work without
            JavaScript, and POST is what lets the Origin check defend it.
          */}
          <form method="post" action="/api/auth/sign-out">
            <button
              type="submit"
              className="border-border rounded-md border px-3 py-1.5 text-sm"
            >
              Ieși din cont
            </button>
          </form>
        </div>
      </header>

      <nav aria-label="Secțiuni" className="flex flex-wrap gap-2 py-4">
        {NAV.map((item) => (
          <Link
            key={item.to}
            to={item.to}
            activeOptions={{ exact: true }}
            className="text-muted-foreground data-[status=active]:text-foreground rounded-md px-2 py-1 text-sm no-underline"
          >
            {item.label}
          </Link>
        ))}
      </nav>

      <Outlet />
    </div>
  )
}
