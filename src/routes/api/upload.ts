import { createFileRoute } from '@tanstack/react-router'
import crypto from 'node:crypto'

import { readAdminSession } from '@/server/auth/session'
import { UploadStoreError, storeUpload } from '@/server/uploads/store.server'

/**
 * Image upload — CLAUDE.md §10.
 *
 * The browser posts the already-processed WebP bytes here and this decides
 * where they land: Vercel Blob when a token exists, a local folder otherwise
 * (see `store.server.ts`).
 *
 * Bytes pass through the server rather than going straight to Blob with a
 * client token. That costs a little memory, but it means the panel works
 * without a Blob store at all, and it keeps `@vercel/blob` out of the client
 * bundle entirely.
 *
 * The admin check is the gate. Without it this would be an open endpoint that
 * writes files to the team's storage.
 */
export const Route = createFileRoute('/api/upload')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const admin = await readAdminSession()
        if (!admin) return new Response('Forbidden', { status: 403 })

        // Same-origin only. The session cookie is SameSite=Lax, which does not
        // stop a POST from a sibling subdomain.
        const origin = request.headers.get('origin')
        if (!origin || new URL(origin).origin !== new URL(request.url).origin) {
          return new Response('Forbidden', { status: 403 })
        }

        let form: FormData
        try {
          form = await request.formData()
        } catch {
          return Response.json({ error: 'bad-request' }, { status: 400 })
        }

        const file = form.get('file')
        const folder = String(form.get('folder') ?? 'diverse')

        if (!(file instanceof File)) {
          return Response.json({ error: 'bad-request' }, { status: 400 })
        }

        try {
          const stored = await storeUpload({
            folder,
            filename: file.name,
            contentType: file.type,
            bytes: await file.arrayBuffer(),
            randomSuffix: crypto.randomBytes(4).toString('hex'),
          })

          return Response.json(stored)
        } catch (caught) {
          if (caught instanceof UploadStoreError) {
            return Response.json(
              { error: caught.reason },
              { status: caught.reason === 'not-configured' ? 501 : 400 },
            )
          }
          return Response.json({ error: 'write-failed' }, { status: 500 })
        }
      },
    },
  },
})
