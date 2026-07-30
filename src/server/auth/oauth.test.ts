import { describe, expect, test } from 'bun:test'

import { base64url, isVerifiedEmail, safeReturnPath } from './oauth'

/**
 * `returnTo` comes straight off the query string, so it is an open-redirect
 * hole unless it is constrained. An attacker who can bounce a freshly
 * authenticated administrator to their own origin gets a convincing phishing
 * page at exactly the moment the admin expects to be signing in.
 */
describe('safeReturnPath — allows', () => {
  test('an admin path', () => {
    expect(safeReturnPath('/admin')).toBe('/admin')
    expect(safeReturnPath('/admin/team')).toBe('/admin/team')
    expect(safeReturnPath('/admin/news/edit?id=3')).toBe('/admin/news/edit?id=3')
  })
})

describe('safeReturnPath — refuses, falling back to /admin', () => {
  test('an absolute URL', () => {
    expect(safeReturnPath('https://evil.example/admin')).toBe('/admin')
    expect(safeReturnPath('http://evil.example')).toBe('/admin')
  })

  test('a protocol-relative URL', () => {
    // `//evil.example` looks relative but the browser treats it as absolute.
    expect(safeReturnPath('//evil.example')).toBe('/admin')
    expect(safeReturnPath('//evil.example/admin')).toBe('/admin')
  })

  test('a backslash variant', () => {
    expect(safeReturnPath('\\\\evil.example')).toBe('/admin')
  })

  test('a path outside the admin panel', () => {
    expect(safeReturnPath('/ro/team')).toBe('/admin')
    expect(safeReturnPath('/')).toBe('/admin')
  })

  test('a lookalike prefix', () => {
    // Must not be fooled by a path that merely starts with the right letters.
    expect(safeReturnPath('/administrator-evil')).toBe('/admin')
    expect(safeReturnPath('/adminsomething')).toBe('/admin')
  })

  test('an empty or missing value', () => {
    expect(safeReturnPath(null)).toBe('/admin')
    expect(safeReturnPath(undefined)).toBe('/admin')
    expect(safeReturnPath('')).toBe('/admin')
  })

  test('a scheme-bearing string', () => {
    expect(safeReturnPath('javascript:alert(1)')).toBe('/admin')
  })
})

describe('base64url', () => {
  test('produces URL-safe output with no padding', () => {
    const encoded = base64url(Buffer.from([251, 255, 190, 255, 0]))
    expect(encoded).not.toContain('+')
    expect(encoded).not.toContain('/')
    expect(encoded).not.toContain('=')
  })
})

/**
 * The allowlist decides *whether* an address may administer the site; this
 * decides whether the address is even real. If it fails open, anyone can put
 * an admin's address on a Google account they control and walk in.
 */
describe('isVerifiedEmail', () => {
  test('accepts only an explicit true', () => {
    expect(isVerifiedEmail(true)).toBe(true)
  })

  test('refuses an explicit false', () => {
    expect(isVerifiedEmail(false)).toBe(false)
  })

  test('refuses an ABSENT claim — the fail-open case', () => {
    // A `=== false` check would return true here and admit the address.
    expect(isVerifiedEmail(undefined)).toBe(false)
  })
})
