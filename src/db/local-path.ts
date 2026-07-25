/**
 * Where the local development database lives (CLAUDE.md §3 note). Gitignored.
 *
 * Kept in its own module with no side effects: `src/db/index.ts` opens a
 * connection at import time, so a script that only needs the path must not
 * import from there or it would open a second connection to the same
 * directory.
 */
export const LOCAL_DB_PATH = '.pglite'
