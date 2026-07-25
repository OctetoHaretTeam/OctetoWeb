import { createServerFn } from '@tanstack/react-start'

import { readAdminSession } from './session'

/**
 * Session lookup for route guards — CLAUDE.md §9.
 *
 * Returns the signed-in administrator, or null. Safe to call from `beforeLoad`
 * on both server and client: `createServerFn` replaces the handler with an RPC
 * stub in the client build, so the session code never ships.
 *
 * This is the UX half of the guard. It is NOT the security boundary: every
 * server function that touches admin data uses `adminMiddleware`, because an
 * endpoint is reachable whether or not the route was ever loaded.
 *
 * NOTHING ELSE IS RE-EXPORTED HERE ON PURPOSE. This module is imported by
 * route files, which are part of the client build. Re-exporting
 * `./middleware` pulled `@tanstack/react-start/server` in behind it and
 * failed the build's import protection. Server-side code should import
 * `./middleware` and `./session` directly.
 */
export const getAdminSession = createServerFn({ method: 'GET' }).handler(
  async () => readAdminSession(),
)

export type { AdminSession } from './session'
