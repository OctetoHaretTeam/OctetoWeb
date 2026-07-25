import { describe, expect, test } from 'bun:test'

import {
  DEFAULT_LOCALE,
  LOCALES,
  isLocale,
  localeFromPathname,
  otherLocale,
  parseAcceptLanguage,
  stripLocale,
  withLocale,
} from './locale'

describe('withLocale', () => {
  /**
   * The classic failure this prevents: switching language on a deep page and
   * being thrown back to the home page (CLAUDE.md §11).
   */
  test('keeps the reader on the same page', () => {
    expect(withLocale('/ro/team/andrei', 'en')).toBe('/en/team/andrei')
    expect(withLocale('/en/team/andrei', 'ro')).toBe('/ro/team/andrei')
  })

  test('handles the locale home page', () => {
    expect(withLocale('/ro', 'en')).toBe('/en')
    expect(withLocale('/en', 'ro')).toBe('/ro')
  })

  test('adds a prefix to an unprefixed path', () => {
    expect(withLocale('/team/andrei', 'ro')).toBe('/ro/team/andrei')
    expect(withLocale('/', 'en')).toBe('/en')
  })

  test('is idempotent for the same locale', () => {
    expect(withLocale('/ro/seasons/2025-26-decode', 'ro')).toBe(
      '/ro/seasons/2025-26-decode',
    )
  })

  test('round-trips through both locales', () => {
    const path = '/ro/performance/non-tech/placeholder-non-tech'
    expect(withLocale(withLocale(path, 'en'), 'ro')).toBe(path)
  })

  test('does not localise slugs — one slug serves both locales', () => {
    // Slugs are printed on merchandise and must never depend on language.
    expect(withLocale('/ro/team/andrei', 'en')).toContain('/team/andrei')
  })

  test('leaves a slug that happens to start with a locale name alone', () => {
    expect(withLocale('/ro/news/romania-visit', 'en')).toBe(
      '/en/news/romania-visit',
    )
  })

  test('does not mistake a deeper segment for a locale', () => {
    expect(withLocale('/ro/team/en', 'en')).toBe('/en/team/en')
  })
})

describe('localeFromPathname', () => {
  test('reads the prefix', () => {
    expect(localeFromPathname('/ro/team')).toBe('ro')
    expect(localeFromPathname('/en')).toBe('en')
  })

  test('returns null for the routes that are not locale-prefixed', () => {
    // /q/ and /admin/ are deliberately outside the scheme (§11).
    expect(localeFromPathname('/q/m-andrei')).toBeNull()
    expect(localeFromPathname('/admin/team')).toBeNull()
    expect(localeFromPathname('/styleguide')).toBeNull()
    expect(localeFromPathname('/')).toBeNull()
  })
})

describe('stripLocale', () => {
  test('removes the prefix', () => {
    expect(stripLocale('/ro/team/andrei')).toBe('/team/andrei')
    expect(stripLocale('/en')).toBe('/')
  })

  test('leaves unprefixed paths untouched', () => {
    expect(stripLocale('/q/pit')).toBe('/q/pit')
    expect(stripLocale('/')).toBe('/')
  })
})

describe('parseAcceptLanguage', () => {
  /**
   * This is the header that decides which language a judge scanning a shirt at
   * an international event lands in (§6, §11).
   */
  test('picks a supported language', () => {
    expect(parseAcceptLanguage('en-US,en;q=0.9')).toBe('en')
    expect(parseAcceptLanguage('ro-RO,ro;q=0.9')).toBe('ro')
  })

  test('matches a regional tag to its base language', () => {
    expect(parseAcceptLanguage('en-GB')).toBe('en')
    expect(parseAcceptLanguage('ro-MD')).toBe('ro')
  })

  test('honours quality values rather than document order', () => {
    expect(parseAcceptLanguage('ro;q=0.2,en;q=0.9')).toBe('en')
    expect(parseAcceptLanguage('en;q=0.3,ro;q=0.8')).toBe('ro')
  })

  test('skips unsupported languages to reach a supported one', () => {
    expect(parseAcceptLanguage('fr-FR,fr;q=0.9,en;q=0.5')).toBe('en')
    expect(parseAcceptLanguage('de,ru;q=0.9,ro;q=0.4')).toBe('ro')
  })

  test('ignores zero-quality entries', () => {
    expect(parseAcceptLanguage('en;q=0,ro;q=0.5')).toBe('ro')
  })

  test('returns null when nothing matches, so the caller applies the default', () => {
    expect(parseAcceptLanguage('fr-FR,de;q=0.8')).toBeNull()
    expect(parseAcceptLanguage('')).toBeNull()
    expect(parseAcceptLanguage(null)).toBeNull()
    expect(parseAcceptLanguage(undefined)).toBeNull()
  })

  test('treats a wildcard as the default locale', () => {
    expect(parseAcceptLanguage('*')).toBe(DEFAULT_LOCALE)
  })

  test('tolerates whitespace and casing', () => {
    expect(parseAcceptLanguage('  EN-US , ro ; q=0.4 ')).toBe('en')
  })
})

describe('locale helpers', () => {
  test('otherLocale flips', () => {
    expect(otherLocale('ro')).toBe('en')
    expect(otherLocale('en')).toBe('ro')
  })

  test('isLocale guards unknown input', () => {
    expect(isLocale('ro')).toBe(true)
    expect(isLocale('fr')).toBe(false)
    expect(isLocale(undefined)).toBe(false)
  })

  test('Romanian is the default', () => {
    expect(DEFAULT_LOCALE).toBe('ro')
    expect(LOCALES).toEqual(['ro', 'en'])
  })
})
