import { createMiddleware } from '@tanstack/react-start'

/**
 * Authorization for server functions — CLAUDE.md §9.
 *
 * The route guard in `/admin/_authed` is for user experience. It is NOT a
 * security boundary: a server function is an endpoint reachable on its own,
 * whether or not the route that normally calls it was ever loaded. So every
 * server function behind the admin panel re-verifies here.
 *
 * IMPORTANT — why the imports are dynamic:
 *
 * `.middleware([adminMiddleware])` is part of a builder chain evaluated at
 * module scope, so this module is reachable from the client build even though
 * the handler bodies are not. A top-level `@tanstack/react-start/server`
 * import here therefore fails import protection. The `.server()` callbacks
 * below ARE stripped client-side, so reaching for the guards from inside them
 * keeps the server code where it belongs.
 */

export const csrfMiddleware = createMiddleware().server(async ({ next }) => {
  const { assertSameOrigin } = await import('./guards.server')
  assertSameOrigin()
  return next()
})

/**
 * Requires a valid admin session, and slides the 8-hour window forward.
 *
 * Attach to every server function that reads or writes admin-only data:
 *
 *   createServerFn({ method: 'POST' })
 *     .middleware([adminMiddleware])
 *     .handler(async ({ context }) => { context.admin.email })
 */
export const adminMiddleware = createMiddleware({ type: 'function' })
  .middleware([csrfMiddleware])
  .server(async ({ next }) => {
    const { requireAdmin } = await import('./guards.server')
    const admin = await requireAdmin()
    return next({ context: { admin } })
  })

export { UnauthorizedError } from './errors'
