import { readFile } from 'node:fs/promises'
import path from 'node:path'

import { createFileRoute } from '@tanstack/react-router'

import { LOCAL_UPLOAD_DIR } from '@/server/uploads/store.server'

/**
 * Serves locally stored uploads in development — CLAUDE.md §3 note.
 *
 * Only exists for the no-Blob path. When `BLOB_READ_WRITE_TOKEN` is set,
 * images are served from Blob's own CDN and nothing reaches this route.
 *
 * Public on purpose: these are the same images the public site renders. The
 * consent rules that decide whether a member's photograph is shown are applied
 * where the row is read (`src/server/team.ts`), not here.
 */
export const Route = createFileRoute('/uploads/$')({
  server: {
    handlers: {
      GET: async ({ params }) => {
        if (process.env.BLOB_READ_WRITE_TOKEN) {
          return new Response('Not found', { status: 404 })
        }

        const requested = params._splat ?? ''

        // Normalise first, then confirm the result is still inside the upload
        // directory. Checking the raw string for ".." misses encoded and
        // Windows-separator variants; comparing resolved paths does not.
        const root = path.resolve(process.cwd(), LOCAL_UPLOAD_DIR)
        const target = path.resolve(root, requested)

        if (target !== root && !target.startsWith(root + path.sep)) {
          return new Response('Not found', { status: 404 })
        }

        try {
          const bytes = await readFile(target)
          return new Response(new Uint8Array(bytes), {
            headers: {
              'content-type': 'image/webp',
              // Names carry a random suffix, so a URL always means one file.
              'cache-control': 'public, max-age=31536000, immutable',
            },
          })
        } catch {
          return new Response('Not found', { status: 404 })
        }
      },
    },
  },
})
