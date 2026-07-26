import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'

/**
 * Where an uploaded image is stored — CLAUDE.md §3 and §10.
 *
 * Two backends, chosen the same way the database chooses its driver:
 *
 * - **Vercel Blob** whenever `BLOB_READ_WRITE_TOKEN` is set. This is the real
 *   store and the only one used in staging or production.
 * - **A local folder** when it is not, so the admin panel is usable before a
 *   Blob store exists. Refused in production, and `public/uploads/` is gitignored.
 *
 * EXIF is already gone by the time bytes arrive here: the browser re-encodes
 * every image through a canvas before uploading (§8), so GPS coordinates never
 * leave the member's device.
 */

/**
 * Local uploads live under `public/` so Vite's own static middleware serves
 * them. A dedicated route cannot: a request ending in `.webp` is claimed by
 * that middleware before TanStack's router ever sees it, so every image 404'd.
 *
 * Gitignored, and unused in production, where Blob is configured.
 */
export const LOCAL_UPLOAD_DIR = path.join('public', 'uploads')

/** Mirrors the browser's output. Nothing else is accepted. */
const ACCEPTED_TYPE = 'image/webp'
const MAX_BYTES = 8 * 1024 * 1024

export type StoredUpload = { url: string }

export type StoreFailure =
  | 'type-not-allowed'
  | 'too-large'
  | 'not-configured'
  | 'write-failed'

export class UploadStoreError extends Error {
  constructor(readonly reason: StoreFailure) {
    super(reason)
    this.name = 'UploadStoreError'
  }
}

/**
 * Strips everything that could escape the upload directory.
 *
 * The name arrives from the browser, so it is untrusted: `../../.env` must not
 * be able to become a write target. Only the basename survives, and only
 * lower-kebab characters within it.
 */
export function safeFilename(name: string): string {
  const base = path
    .basename(name)
    .replace(/\.[^.]*$/, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60)

  return `${base || 'imagine'}.webp`
}

/** Keeps two uploads of the same photo from overwriting each other. */
function withSuffix(filename: string, suffix: string): string {
  return filename.replace(/\.webp$/, `-${suffix}.webp`)
}

export async function storeUpload({
  folder,
  filename,
  contentType,
  bytes,
  randomSuffix,
}: {
  folder: string
  filename: string
  contentType: string
  bytes: ArrayBuffer
  /** Passed in rather than generated here so this stays deterministic. */
  randomSuffix: string
}): Promise<StoredUpload> {
  if (contentType !== ACCEPTED_TYPE) {
    throw new UploadStoreError('type-not-allowed')
  }

  if (bytes.byteLength > MAX_BYTES) {
    throw new UploadStoreError('too-large')
  }

  const safeFolder = folder.replace(/[^a-z0-9-]/g, '') || 'diverse'
  const name = withSuffix(safeFilename(filename), randomSuffix)
  const key = `${safeFolder}/${name}`
  const token = process.env.BLOB_READ_WRITE_TOKEN

  if (token) {
    const { put } = await import('@vercel/blob')
    const result = await put(key, bytes, {
      access: 'public',
      contentType: ACCEPTED_TYPE,
      token,
    })
    return { url: result.url }
  }

  if (process.env.NODE_ENV === 'production') {
    // Local disk is not durable on a serverless host, so refuse rather than
    // write a file that will vanish and leave a broken image on the site.
    throw new UploadStoreError('not-configured')
  }

  try {
    const dir = path.join(process.cwd(), LOCAL_UPLOAD_DIR, safeFolder)
    await mkdir(dir, { recursive: true })
    await writeFile(path.join(dir, name), Buffer.from(bytes))
  } catch {
    throw new UploadStoreError('write-failed')
  }

  return { url: `/uploads/${key}` }
}
