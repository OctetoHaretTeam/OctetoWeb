import { Outlet, createFileRoute } from '@tanstack/react-router'

/**
 * Admin shell — CLAUDE.md §10.
 *
 * Not locale-prefixed and Romanian-only: this is for the team, not the public
 * (§11). Deliberately carries no guard, so `/admin/sign-in` can live under it;
 * the guard is the pathless `_authed` layout.
 */
export const Route = createFileRoute('/admin')({
  head: () => ({
    meta: [
      { title: 'Administrare — OctetoHaret' },
      // Never index the admin panel.
      { name: 'robots', content: 'noindex, nofollow' },
    ],
  }),
  component: () => (
    <div className="bg-background text-foreground min-h-screen">
      <Outlet />
    </div>
  ),
})
