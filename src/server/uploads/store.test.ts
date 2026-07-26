import { describe, expect, test } from 'bun:test'
import { existsSync } from 'node:fs'
import { rm } from 'node:fs/promises'
import path from 'node:path'

import {
  LOCAL_UPLOAD_DIR,
  UploadStoreError,
  safeFilename,
  storeUpload,
} from './store.server'

/**
 * The filename arrives from the browser, so it is untrusted input on a path
 * that ends in a filesystem write.
 */
describe('safeFilename', () => {
  test('keeps a reasonable name', () => {
    expect(safeFilename('andrei-popescu.webp')).toBe('andrei-popescu.webp')
  })

  test('strips directory traversal', () => {
    // `.env` is entirely extension, so nothing survives — safer still.
    expect(safeFilename('../../../.env')).toBe('imagine.webp')
    expect(safeFilename('../../secrets')).toBe('secrets.webp')
    expect(safeFilename('/etc/passwd')).toBe('passwd.webp')
    expect(safeFilename('..\\..\\windows\\system32')).toBe('system32.webp')
  })

  test('never returns a name containing a separator', () => {
    for (const evil of ['a/b', 'a\\b', '../x', './x', 'a/../b']) {
      const result = safeFilename(evil)
      expect(result).not.toContain('/')
      expect(result).not.toContain('\\')
      expect(result).not.toContain('..')
    }
  })

  test('always ends in .webp, whatever came in', () => {
    for (const name of ['x.php', 'x.html', 'x', 'x.webp.php']) {
      expect(safeFilename(name).endsWith('.webp')).toBe(true)
    }
  })

  test('handles a name that sanitises to nothing', () => {
    expect(safeFilename('///')).toBe('imagine.webp')
    expect(safeFilename('...')).toBe('imagine.webp')
  })
})

describe('storeUpload', () => {
  const bytes = new Uint8Array([1, 2, 3, 4]).buffer

  test('refuses anything but the WebP the browser produces', async () => {
    await expect(
      storeUpload({
        folder: 'team',
        filename: 'x.webp',
        contentType: 'image/svg+xml',
        bytes,
        randomSuffix: 'aaaa',
      }),
    ).rejects.toThrow(UploadStoreError)
  })

  test('refuses an oversized payload', async () => {
    await expect(
      storeUpload({
        folder: 'team',
        filename: 'x.webp',
        contentType: 'image/webp',
        bytes: new ArrayBuffer(9 * 1024 * 1024),
        randomSuffix: 'aaaa',
      }),
    ).rejects.toThrow(UploadStoreError)
  })

  test('writes locally and returns a servable URL', async () => {
    const result = await storeUpload({
      folder: 'team',
      filename: 'Andrei Popescu.JPG',
      contentType: 'image/webp',
      bytes,
      randomSuffix: 'beef',
    })

    expect(result.url).toBe('/uploads/team/andrei-popescu-beef.webp')
    expect(
      existsSync(
        path.join(process.cwd(), LOCAL_UPLOAD_DIR, 'team', 'andrei-popescu-beef.webp'),
      ),
    ).toBe(true)

    await rm(path.join(process.cwd(), LOCAL_UPLOAD_DIR, 'team'), {
      recursive: true,
      force: true,
    })
  })

  test('a traversing filename cannot escape the upload folder', async () => {
    const result = await storeUpload({
      folder: 'team',
      filename: '../../../evil',
      contentType: 'image/webp',
      bytes,
      randomSuffix: 'cafe',
    })

    expect(result.url).toBe('/uploads/team/evil-cafe.webp')
    expect(result.url).not.toContain('..')

    await rm(path.join(process.cwd(), LOCAL_UPLOAD_DIR, 'team'), {
      recursive: true,
      force: true,
    })
  })
})
