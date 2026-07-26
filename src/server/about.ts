import { createServerFn } from '@tanstack/react-start'
import { eq } from 'drizzle-orm'

import { db } from '@/db'
import { teamInfo } from '@/db/schema'

/**
 * The team info singleton — CLAUDE.md §5.
 *
 * Returns null when the row has never been filled in, so /about can show an
 * honest empty state rather than a page of blanks.
 */
export const getTeamInfo = createServerFn({ method: 'GET' }).handler(
  async () => {
    const rows = await db.select().from(teamInfo).where(eq(teamInfo.id, 1)).limit(1)
    const row = rows[0]
    if (!row) return null

    const { originStoryRo, originStoryEn, ...rest } = row
    const { renderMarkdown } = await import('./markdown.server')

    return {
      ...rest,
      originStoryHtml: {
        ro: renderMarkdown(originStoryRo),
        en: originStoryEn ? renderMarkdown(originStoryEn) : null,
      },
    }
  },
)
