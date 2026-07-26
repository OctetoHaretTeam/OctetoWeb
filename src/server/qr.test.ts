import { describe, expect, test } from 'bun:test'

import { countryFromHeaders, localeForScan } from './qr.server'

const headers = (init: Record<string, string>) => new Headers(init)

/**
 * The scan log is the site's only telemetry and §6 limits it to a coarse
 * country. These pin what is accepted as one.
 */
describe('countryFromHeaders', () => {
  test('reads the header the host provides', () => {
    expect(countryFromHeaders(headers({ 'x-vercel-ip-country': 'MD' }))).toBe('MD')
    expect(countryFromHeaders(headers({ 'cf-ipcountry': 'ro' }))).toBe('RO')
  })

  test('returns null when there is no country, rather than guessing', () => {
    expect(countryFromHeaders(headers({}))).toBeNull()
  })

  test('rejects the placeholders networks send for unknown', () => {
    expect(countryFromHeaders(headers({ 'cf-ipcountry': 'XX' }))).toBeNull()
    expect(countryFromHeaders(headers({ 'cf-ipcountry': 'T1' }))).toBeNull()
  })

  test('rejects anything that is not a two-letter code', () => {
    for (const value of ['', 'MDA', 'M', '12', 'Moldova']) {
      expect(countryFromHeaders(headers({ 'x-vercel-ip-country': value }))).toBeNull()
    }
  })
})

/**
 * The resolution order that decides which language a scanned shirt opens in.
 */
describe('localeForScan', () => {
  test('the cookie wins', () => {
    expect(
      localeForScan(headers({ 'accept-language': 'en-US' }), 'locale=ro'),
    ).toBe('ro')
  })

  test('falls back to Accept-Language — the case §6 cares about', () => {
    // A judge at an international event should land on English untouched.
    expect(localeForScan(headers({ 'accept-language': 'en-GB,en;q=0.9' }), null)).toBe(
      'en',
    )
  })

  test('falls back to Romanian when nothing matches', () => {
    expect(localeForScan(headers({ 'accept-language': 'fr-FR' }), null)).toBe('ro')
    expect(localeForScan(headers({}), null)).toBe('ro')
  })

  test('ignores a cookie that is not a supported locale', () => {
    expect(
      localeForScan(headers({ 'accept-language': 'en' }), 'locale=fr'),
    ).toBe('en')
  })

  test('finds the locale cookie among others', () => {
    expect(
      localeForScan(headers({}), 'other=1; locale=en; another=2'),
    ).toBe('en')
  })
})
