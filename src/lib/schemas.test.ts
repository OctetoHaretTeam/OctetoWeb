import { describe, expect, test } from 'bun:test'

import {
  galleryWithMax,
  imageFitClass,
  imageSchema,
  imageUrlSchema,
} from './schemas'

const VALID_IMAGE = {
  url: '/uploads/team/andrei-beef.webp',
  alt: { ro: 'Andrei în atelier' },
  width: 800,
  height: 800,
}

/**
 * A bare `z.url()` here rejected every locally stored image, so no row with a
 * picture could be saved. These pin both halves of the fix.
 */
describe('imageUrlSchema accepts', () => {
  test('a site-relative path, as the local store produces', () => {
    expect(imageUrlSchema.safeParse('/uploads/team/x.webp').success).toBe(true)
  })

  test('an absolute https URL, as Vercel Blob produces', () => {
    expect(
      imageUrlSchema.safeParse('https://abc.public.blob.vercel-storage.com/x.webp')
        .success,
    ).toBe(true)
  })
})

describe('imageUrlSchema refuses', () => {
  test('a protocol-relative URL', () => {
    // Looks relative, but the browser treats it as another origin.
    expect(imageUrlSchema.safeParse('//evil.example/x.webp').success).toBe(false)
  })

  test('a bare filename or a relative path with no leading slash', () => {
    expect(imageUrlSchema.safeParse('x.webp').success).toBe(false)
    expect(imageUrlSchema.safeParse('uploads/x.webp').success).toBe(false)
  })

  test('a non-http scheme', () => {
    expect(imageUrlSchema.safeParse('javascript:alert(1)').success).toBe(false)
    expect(imageUrlSchema.safeParse('data:image/webp;base64,AA').success).toBe(
      false,
    )
  })

  test('an empty string', () => {
    expect(imageUrlSchema.safeParse('').success).toBe(false)
  })
})

describe('imageSchema', () => {
  test('accepts a locally stored image', () => {
    expect(imageSchema.safeParse(VALID_IMAGE).success).toBe(true)
  })

  test('accepts optional fit values contain and cover', () => {
    expect(
      imageSchema.safeParse({ ...VALID_IMAGE, fit: 'contain' }).success,
    ).toBe(true)
    expect(
      imageSchema.safeParse({ ...VALID_IMAGE, fit: 'cover' }).success,
    ).toBe(true)
  })

  test('rejects invalid fit values', () => {
    expect(
      imageSchema.safeParse({ ...VALID_IMAGE, fit: 'stretch' }).success,
    ).toBe(false)
  })

  test('still requires Romanian alt text — §7.7', () => {
    expect(
      imageSchema.safeParse({ ...VALID_IMAGE, alt: { ro: '' } }).success,
    ).toBe(false)
  })

  test('still requires dimensions, so the box can be reserved — §12', () => {
    const { width: _w, ...noWidth } = VALID_IMAGE
    expect(imageSchema.safeParse(noWidth).success).toBe(false)
    expect(
      imageSchema.safeParse({ ...VALID_IMAGE, width: 0 }).success,
    ).toBe(false)
  })
})

describe('imageFitClass', () => {
  test('returns image-fit-contain by default when fit is omitted or null', () => {
    expect(imageFitClass(undefined)).toBe('image-fit-contain')
    expect(imageFitClass(null)).toBe('image-fit-contain')
    expect(imageFitClass({})).toBe('image-fit-contain')
    expect(imageFitClass({ fit: 'contain' })).toBe('image-fit-contain')
  })

  test('returns image-fit-cover when fit is cover or defaultFit is cover', () => {
    expect(imageFitClass({ fit: 'cover' })).toBe('image-fit-cover')
    expect(imageFitClass({}, 'cover')).toBe('image-fit-cover')
    expect(imageFitClass({ fit: 'contain' }, 'cover')).toBe('image-fit-contain')
  })
})

describe('galleryWithMax', () => {
  const image = (n: number) => ({ ...VALID_IMAGE, url: `/uploads/x-${n}.webp` })

  test('accepts up to the cap', () => {
    const five = Array.from({ length: 5 }, (_, i) => image(i))
    expect(galleryWithMax(5).safeParse(five).success).toBe(true)
  })

  test('refuses one over the cap', () => {
    const six = Array.from({ length: 6 }, (_, i) => image(i))
    expect(galleryWithMax(5).safeParse(six).success).toBe(false)
  })

  test('accepts an empty gallery', () => {
    expect(galleryWithMax(10).safeParse([]).success).toBe(true)
  })
})

