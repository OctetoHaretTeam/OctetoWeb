import { createFileRoute } from '@tanstack/react-router'
import { handleUpload } from '@vercel/blob/client'

import { readAdminSession } from '@/server/auth/session'

/**
 * Issues client upload tokens for Vercel Blob — CLAUDE.md §10.
 *
 * The browser uploads straight to Blob rather than streaming the bytes through
 * this server, which keeps a 12 MB photo off the function's memory and time
 * budget. What this endpoint controls is WHO may upload and WHAT:
 *
 * - An admin session is required before any token is issued. Without this,
 *   the endpoint would hand anyone a write credential for the team's storage.
 * - The MIME allowlist and size cap are repeated here even though the client
 *   already enforces them, because the client is not a control (§10).
 *
 * EXIF is stripped in the browser before the upload starts (see
 * `@/lib/images/process`), so a photo's GPS coordinates never leave the
 * member's device — not even to be cleaned up server-side.
 */
export const Route = createFileRoute('/api/blob/upload')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const admin = await readAdminSession()
        if (!admin) {
          return new Response('Forbidden', { status: 403 })
        }

        const token = process.env.BLOB_READ_WRITE_TOKEN
        if (!token) {
          return new Response(
            'BLOB_READ_WRITE_TOKEN is not configured.',
            { status: 501 },
          )
        }

        try {
          const body = await request.json()

          const result = await handleUpload({
            token,
            request,
            body,
            onBeforeGenerateToken: async () => ({
              // The browser re-encodes everything to WebP, so this is the only
              // type that should ever arrive.
              allowedContentTypes: ['image/webp'],
              maximumSizeInBytes: 8 * 1024 * 1024,
              addRandomSuffix: true,
            }),
            // Nothing to record: the URL is stored on whichever row the editor
            // is editing, when that row is saved.
            onUploadCompleted: async () => {},
          })

          return Response.json(result)
        } catch {
          return new Response('Upload failed', { status: 400 })
        }
      },
    },
  },
})
