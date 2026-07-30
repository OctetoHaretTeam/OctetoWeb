import { createFileRoute } from '@tanstack/react-router'
import crypto from 'node:crypto'

import { readAdminSession } from '@/server/auth/session'
import { rateLimit } from '@/server/rate-limit'
import {
  MAX_UPLOAD_BYTES,
  UploadStoreError,
  storeUpload,
} from '@/server/uploads/store.server'

/**
 * Content-Length covers the whole multipart envelope — boundaries, part
 * headers, the folder field — not just the file, so the early check needs
 * headroom or it would reject a file that is legitimately at the limit.
 */
const MAX_REQUEST_BYTES = MAX_UPLOAD_BYTES + 64 * 1024

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

        /*
         * Throttled even though it is admin-only. The session lasts 8 hours
         * (§9), so a stolen or borrowed one is a window in which this endpoint
         * writes to the team's Blob store — which is billed, and unlike the
         * database has no other quota in front of it. 30/min is far above what
         * a person filling in a gallery does by hand.
         */
        const blocked = rateLimit('upload', request, 30, 60_000)
        if (blocked) return blocked

        // Same-origin only. The session cookie is SameSite=Lax, which does not
        // stop a POST from a sibling subdomain.
        const origin = request.headers.get('origin')
        if (!origin || new URL(origin).origin !== new URL(request.url).origin) {
          return new Response('Forbidden', { status: 403 })
        }

        /*
         * Reject on the declared length BEFORE reading the body.
         *
         * `storeUpload` enforces the real 8 MB cap, but it only sees the bytes
         * after `formData()` has already buffered the entire request into
         * memory — so a multi-gigabyte POST was paid for in full and only then
         * refused. Checking Content-Length first makes that cost O(headers).
         *
         * This is a cheap early exit, not the security boundary: the header is
         * attacker-controlled and a chunked request omits it entirely. The
         * byte-length check in `storeUpload` remains the actual limit.
         */
        const declaredLength = Number(request.headers.get('content-length'))
        if (Number.isFinite(declaredLength) && declaredLength > MAX_REQUEST_BYTES) {
          return Response.json({ error: 'too-large' }, { status: 413 })
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
