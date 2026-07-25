/**
 * Kept in its own module with no server-only imports, because it is referenced
 * from both the middleware chain (which is evaluated in the client build) and
 * the server-only guards.
 */
export class UnauthorizedError extends Error {
  readonly status = 403

  constructor() {
    // Deliberately uninformative. CLAUDE.md §9: leak nothing about whether an
    // address exists or why access was refused.
    super('Forbidden')
    this.name = 'UnauthorizedError'
  }
}
