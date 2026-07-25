import { describe, expect, test } from 'bun:test'

import { bilingual, getLocalized } from './localized'

/**
 * The RO-fallback rule is called on every bilingual field on every route, so a
 * regression here is site-wide and silent — the page still renders, it just
 * renders the wrong language or drops the "only in Romanian" note.
 */

describe('getLocalized', () => {
  test('returns the requested locale when both are present', () => {
    expect(getLocalized({ ro: 'Salut', en: 'Hi' }, 'ro')).toEqual({
      value: 'Salut',
      isFallback: false,
      resolvedLocale: 'ro',
    })
    expect(getLocalized({ ro: 'Salut', en: 'Hi' }, 'en')).toEqual({
      value: 'Hi',
      isFallback: false,
      resolvedLocale: 'en',
    })
  })

  test('respects the locale argument rather than preferring English', () => {
    // A plain `field.en || field.ro` would return English here. It must not:
    // Romanian is the default locale and a RO reader asked for RO.
    const result = getLocalized({ ro: 'Salut', en: 'Hi' }, 'ro')
    expect(result?.value).toBe('Salut')
  })

  test('falls back to Romanian when English is missing, and flags it', () => {
    for (const missing of [null, undefined, '', '   ']) {
      const result = getLocalized({ ro: 'Salut', en: missing }, 'en')
      expect(result).toEqual({
        value: 'Salut',
        isFallback: true,
        resolvedLocale: 'ro',
      })
    }
  })

  test('isFallback drives the note, so it is false whenever no fallback happened', () => {
    expect(getLocalized({ ro: 'Salut', en: 'Hi' }, 'en')?.isFallback).toBe(false)
    expect(getLocalized({ ro: 'Salut', en: 'Hi' }, 'ro')?.isFallback).toBe(false)
    expect(getLocalized({ ro: 'Salut', en: null }, 'ro')?.isFallback).toBe(false)
  })

  test('returns null when neither side has content, so no empty block renders', () => {
    expect(getLocalized({ ro: null, en: null }, 'en')).toBeNull()
    expect(getLocalized({ ro: '', en: '  ' }, 'ro')).toBeNull()
    expect(getLocalized({}, 'ro')).toBeNull()
  })

  test('shows English rather than nothing when only English exists', () => {
    expect(getLocalized({ ro: null, en: 'Hi' }, 'ro')).toEqual({
      value: 'Hi',
      isFallback: true,
      resolvedLocale: 'en',
    })
  })

  test('trims surrounding whitespace', () => {
    expect(getLocalized({ ro: '  Salut  ' }, 'ro')?.value).toBe('Salut')
  })

  test('preserves Romanian diacritics', () => {
    const text = 'Echipa din Chișinău a câștigat premiul Connect'
    expect(getLocalized({ ro: text }, 'ro')?.value).toBe(text)
  })
})

describe('bilingual', () => {
  const post = {
    titleRo: 'Titlu',
    titleEn: null,
    excerptRo: 'Rezumat',
    excerptEn: 'Summary',
  }

  test('picks the …Ro / …En column pair off a row', () => {
    expect(bilingual(post, 'title')).toEqual({ ro: 'Titlu', en: null })
    expect(bilingual(post, 'excerpt')).toEqual({
      ro: 'Rezumat',
      en: 'Summary',
    })
  })

  test('composes with getLocalized', () => {
    expect(getLocalized(bilingual(post, 'title'), 'en')).toEqual({
      value: 'Titlu',
      isFallback: true,
      resolvedLocale: 'ro',
    })
    expect(getLocalized(bilingual(post, 'excerpt'), 'en')).toEqual({
      value: 'Summary',
      isFallback: false,
      resolvedLocale: 'en',
    })
  })
})
