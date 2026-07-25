/**
 * Image preparation before upload — CLAUDE.md §8 and §12.
 *
 * Every uploaded image is decoded and re-encoded through a canvas. That is not
 * a compression step that happens to help: it is how EXIF is removed. Encoding
 * from raw pixels cannot carry metadata forward, so the GPS coordinates in a
 * photo taken on a member's phone are gone — and because this runs in the
 * browser, they never leave the device at all.
 *
 * Re-encoding also yields the exact dimensions, which §12 requires so that
 * every image can reserve its box before it loads and CLS stays at zero.
 */

/** §10's MIME allowlist. Anything else is refused before it is read. */
export const ALLOWED_UPLOAD_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/avif',
] as const

/** Refused before decoding, so a huge file cannot exhaust memory. */
export const MAX_UPLOAD_BYTES = 12 * 1024 * 1024

/** Longest edge after processing. Larger than any layout slot on the site. */
const MAX_EDGE = 2000

const OUTPUT_TYPE = 'image/webp'
const OUTPUT_QUALITY = 0.82

export type ProcessedImage = {
  blob: Blob
  width: number
  height: number
  /** What the processing achieved, for display in the admin UI. */
  originalBytes: number
}

export type ProcessError =
  | 'type-not-allowed'
  | 'too-large'
  | 'decode-failed'
  | 'encode-failed'

export class ImageProcessError extends Error {
  constructor(readonly reason: ProcessError) {
    super(reason)
    this.name = 'ImageProcessError'
  }
}

export function isAllowedType(type: string): boolean {
  return (ALLOWED_UPLOAD_TYPES as readonly string[]).includes(type)
}

/**
 * Decodes, orients, optionally downscales, and re-encodes to WebP.
 *
 * `imageOrientation: 'from-image'` matters: it applies the EXIF orientation
 * flag while decoding, so a portrait photo stays portrait once the metadata
 * carrying that flag is discarded.
 */
export async function processImage(file: File): Promise<ProcessedImage> {
  if (!isAllowedType(file.type)) {
    throw new ImageProcessError('type-not-allowed')
  }

  if (file.size > MAX_UPLOAD_BYTES) {
    throw new ImageProcessError('too-large')
  }

  let bitmap: ImageBitmap
  try {
    bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' })
  } catch {
    throw new ImageProcessError('decode-failed')
  }

  const { width, height } = fitWithin(bitmap.width, bitmap.height, MAX_EDGE)

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height

  const context = canvas.getContext('2d')
  if (!context) {
    bitmap.close()
    throw new ImageProcessError('encode-failed')
  }

  context.drawImage(bitmap, 0, 0, width, height)
  bitmap.close()

  const blob = await new Promise<Blob | null>((resolve) => {
    canvas.toBlob(resolve, OUTPUT_TYPE, OUTPUT_QUALITY)
  })

  if (!blob) throw new ImageProcessError('encode-failed')

  return { blob, width, height, originalBytes: file.size }
}

/** Scales to fit inside a square of `max`, never enlarging. */
export function fitWithin(
  width: number,
  height: number,
  max: number,
): { width: number; height: number } {
  const longest = Math.max(width, height)
  if (longest <= max) return { width, height }

  const scale = max / longest
  return {
    width: Math.max(1, Math.round(width * scale)),
    height: Math.max(1, Math.round(height * scale)),
  }
}

/** Builds the stored pathname. Kept stable so re-uploads are predictable. */
export function uploadPathname(folder: string, originalName: string): string {
  const base = originalName
    .replace(/\.[^.]+$/, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60)

  return `${folder}/${base || 'imagine'}.webp`
}
