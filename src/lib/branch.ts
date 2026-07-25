/**
 * The tech / non-tech split (CLAUDE.md §7.3), as a client-safe type.
 *
 * These values mirror the `performance_branch` Postgres enum, but are declared
 * here rather than imported from `@/db/schema` so that a component can name a
 * branch without pulling Drizzle into the client bundle. `branch.test.ts`
 * asserts the two stay in step.
 */

export const BRANCHES = ['tech', 'non_tech'] as const

export type Branch = (typeof BRANCHES)[number]

/**
 * URL segment per branch. The database uses `non_tech`; the route in §4 is
 * `/performance/non-tech`. Slugs are printed on merchandise, so this mapping
 * is deliberate rather than a `replace('_', '-')` at each call site.
 */
export const BRANCH_SLUGS: Record<Branch, string> = {
  tech: 'tech',
  non_tech: 'non-tech',
}

const BRANCH_BY_SLUG: Record<string, Branch> = {
  tech: 'tech',
  'non-tech': 'non_tech',
}

export function isBranch(value: unknown): value is Branch {
  return typeof value === 'string' && (BRANCHES as readonly string[]).includes(value)
}

/** Resolves a URL segment to a branch, or null if it is not one. */
export function branchFromSlug(slug: string): Branch | null {
  return BRANCH_BY_SLUG[slug] ?? null
}
