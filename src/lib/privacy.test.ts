import { describe, expect, test } from 'bun:test'

import { publicDisplayName, publicPhoto } from './privacy'
import type { ImageAsset } from './schemas'

/**
 * CLAUDE.md §8. These tests exist because the failure mode is invisible: the
 * page still renders, it just exposes a minor's surname or photograph.
 */

describe('publicDisplayName', () => {
  test('withholds the surname by default', () => {
    expect(
      publicDisplayName({ name: 'Andrei Popescu', fullNamePublic: false }),
    ).toBe('Andrei P.')
  })

  test('shows the full name only with explicit consent', () => {
    expect(
      publicDisplayName({ name: 'Andrei Popescu', fullNamePublic: true }),
    ).toBe('Andrei Popescu')
  })

  test('drops middle names rather than initialising them', () => {
    expect(
      publicDisplayName({ name: 'Ana Maria Popescu', fullNamePublic: false }),
    ).toBe('Ana P.')
  })

  test('leaves a single-part name alone', () => {
    expect(publicDisplayName({ name: 'Andrei', fullNamePublic: false })).toBe(
      'Andrei',
    )
  })

  test('collapses stray whitespace', () => {
    expect(
      publicDisplayName({ name: '  Andrei   Popescu ', fullNamePublic: false }),
    ).toBe('Andrei P.')
  })

  test('handles Romanian diacritics in the initial', () => {
    expect(
      publicDisplayName({ name: 'Ștefan Țurcanu', fullNamePublic: false }),
    ).toBe('Ștefan Ț.')
  })

  test('never leaks a surname without consent, across many shapes', () => {
    const names = [
      'Andrei Popescu',
      'Ana Maria Popescu',
      'Ion Popa-Lungu',
      'Ștefan Țurcanu',
    ]
    for (const name of names) {
      const shown = publicDisplayName({ name, fullNamePublic: false })
      const surname = name.split(' ').slice(1).join(' ')
      if (surname) expect(shown).not.toContain(surname)
    }
  })
})

describe('publicPhoto', () => {
  const image: ImageAsset = {
    url: 'https://example.test/a.webp',
    alt: { ro: 'Fotografie' },
    width: 400,
    height: 400,
  }

  test('withholds the photo when consent is absent, even though one exists', () => {
    expect(publicPhoto({ image, photoConsent: false })).toBeNull()
  })

  test('returns the photo with consent', () => {
    expect(publicPhoto({ image, photoConsent: true })).toEqual(image)
  })

  test('returns null when there is no photo at all', () => {
    expect(publicPhoto({ image: null, photoConsent: true })).toBeNull()
  })
})
