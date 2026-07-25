import { describe, expect, test } from 'bun:test'

import { isAllowedAdmin, parseAdminEmails } from './allowlist'

/**
 * This function is the entire authorization decision for the admin panel
 * (CLAUDE.md §9), so it is tested for what must be REFUSED at least as hard as
 * for what is allowed.
 */

const ALLOWLIST = 'cineva@example.com, Altcineva@Example.COM'

describe('parseAdminEmails', () => {
  test('splits, trims and lower-cases', () => {
    expect(parseAdminEmails(ALLOWLIST)).toEqual([
      'cineva@example.com',
      'altcineva@example.com',
    ])
  })

  test('drops blank entries rather than keeping empty strings', () => {
    // A trailing comma must not produce an entry that matches a blank email.
    expect(parseAdminEmails('a@b.com,,  ,')).toEqual(['a@b.com'])
  })

  test('an unset or empty variable allows nobody', () => {
    expect(parseAdminEmails(undefined)).toEqual([])
    expect(parseAdminEmails(null)).toEqual([])
    expect(parseAdminEmails('')).toEqual([])
    expect(parseAdminEmails('   ')).toEqual([])
  })
})

describe('isAllowedAdmin — allows', () => {
  test('an exact match', () => {
    expect(isAllowedAdmin('cineva@example.com', ALLOWLIST)).toBe(true)
  })

  test('any casing on either side', () => {
    expect(isAllowedAdmin('CINEVA@EXAMPLE.COM', ALLOWLIST)).toBe(true)
    expect(isAllowedAdmin('altcineva@example.com', ALLOWLIST)).toBe(true)
  })

  test('surrounding whitespace from the provider', () => {
    expect(isAllowedAdmin('  cineva@example.com  ', ALLOWLIST)).toBe(true)
  })
})

describe('isAllowedAdmin — refuses', () => {
  test('an address that is not listed', () => {
    expect(isAllowedAdmin('altul@example.com', ALLOWLIST)).toBe(false)
  })

  test('an empty or missing email, even against a populated list', () => {
    expect(isAllowedAdmin('', ALLOWLIST)).toBe(false)
    expect(isAllowedAdmin('   ', ALLOWLIST)).toBe(false)
    expect(isAllowedAdmin(undefined, ALLOWLIST)).toBe(false)
    expect(isAllowedAdmin(null, ALLOWLIST)).toBe(false)
  })

  test('everyone when the allowlist is unset — fail closed, never open', () => {
    // A missing env var must lock the panel, not unlock it.
    expect(isAllowedAdmin('cineva@example.com', undefined)).toBe(false)
    expect(isAllowedAdmin('cineva@example.com', '')).toBe(false)
  })

  test('a plus-address alias of a listed account', () => {
    // Anyone can mint these on their own Google account.
    expect(isAllowedAdmin('cineva+admin@example.com', ALLOWLIST)).toBe(false)
  })

  test('a lookalike domain', () => {
    expect(isAllowedAdmin('cineva@example.com.evil.com', ALLOWLIST)).toBe(false)
    expect(isAllowedAdmin('cineva@examp1e.com', ALLOWLIST)).toBe(false)
  })

  test('a substring or superstring of a listed address', () => {
    expect(isAllowedAdmin('ineva@example.com', ALLOWLIST)).toBe(false)
    expect(isAllowedAdmin('xcineva@example.com', ALLOWLIST)).toBe(false)
    expect(isAllowedAdmin('cineva@example.co', ALLOWLIST)).toBe(false)
  })

  test('a whole-list injection attempt', () => {
    expect(isAllowedAdmin('a@b.com,cineva@example.com', ALLOWLIST)).toBe(false)
  })

  test('the literal allowlist string', () => {
    expect(isAllowedAdmin(ALLOWLIST, ALLOWLIST)).toBe(false)
  })
})
