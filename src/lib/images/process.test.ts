import { describe, expect, test } from 'bun:test'

import {
  ALLOWED_UPLOAD_TYPES,
  MAX_UPLOAD_BYTES,
  fitWithin,
  isAllowedType,
  uploadPathname,
} from './process'

/**
 * `processImage` itself needs a browser canvas, so these cover the pure parts:
 * the MIME allowlist, the scaling maths, and the pathname builder.
 */

describe('the MIME allowlist', () => {
  test('accepts the formats the site serves', () => {
    for (const type of ALLOWED_UPLOAD_TYPES) {
      expect(isAllowedType(type)).toBe(true)
    }
  })

  test('refuses anything that is not a raster image', () => {
    // SVG is deliberately absent: it can carry scripts, and an admin upload
    // is still untrusted input as far as the browser is concerned.
    for (const type of [
      'image/svg+xml',
      'text/html',
      'application/pdf',
      'image/gif',
      '',
      'image/jpeg; charset=utf-8',
    ]) {
      expect(isAllowedType(type)).toBe(false)
    }
  })

  test('the size cap is a sane figure', () => {
    expect(MAX_UPLOAD_BYTES).toBeGreaterThan(1024 * 1024)
    expect(MAX_UPLOAD_BYTES).toBeLessThanOrEqual(25 * 1024 * 1024)
  })
})

describe('fitWithin', () => {
  test('leaves a small image alone', () => {
    expect(fitWithin(800, 600, 2000)).toEqual({ width: 800, height: 600 })
  })

  test('scales the longest edge down and keeps the ratio', () => {
    expect(fitWithin(4000, 3000, 2000)).toEqual({ width: 2000, height: 1500 })
    expect(fitWithin(3000, 4000, 2000)).toEqual({ width: 1500, height: 2000 })
  })

  test('never enlarges', () => {
    expect(fitWithin(100, 100, 2000)).toEqual({ width: 100, height: 100 })
  })

  test('never rounds an edge down to zero', () => {
    const result = fitWithin(10000, 3, 2000)
    expect(result.height).toBeGreaterThanOrEqual(1)
  })

  test('handles an exact fit', () => {
    expect(fitWithin(2000, 1000, 2000)).toEqual({ width: 2000, height: 1000 })
  })
})

describe('uploadPathname', () => {
  test('slugifies the original name and forces the output extension', () => {
    expect(uploadPathname('team', 'Andrei Popescu.JPG')).toBe(
      'team/andrei-popescu.webp',
    )
  })

  test('strips characters that do not belong in a URL', () => {
    expect(uploadPathname('news', 'foto (1)@2x!.png')).toBe(
      'news/foto-1-2x.webp',
    )
  })

  test('handles a name that slugifies to nothing', () => {
    expect(uploadPathname('team', '###.png')).toBe('team/imagine.webp')
  })

  test('caps a very long name', () => {
    const long = 'a'.repeat(200) + '.png'
    const result = uploadPathname('team', long)
    expect(result.length).toBeLessThan(80)
  })
})
