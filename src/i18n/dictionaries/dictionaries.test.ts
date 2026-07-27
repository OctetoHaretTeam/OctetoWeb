import { describe, expect, test } from 'bun:test'

import { LOCALES } from '../locale'
import { DICTIONARIES, getDictionary } from './index'

/**
 * The type system already guarantees the two dictionaries have identical keys —
 * `en.ts` is typed as `Dictionary`, so a missing key fails the build.
 *
 * These tests cover what types cannot: that a key was not "filled in" by
 * pasting the Romanian string, and that nothing is blank. A blank button at a
 * competition is the failure mode this whole system exists to prevent.
 */

type Flat = Record<string, string>

function flatten(value: unknown, prefix = ''): Flat {
  const out: Flat = {}
  for (const [key, entry] of Object.entries(value as Record<string, unknown>)) {
    const path = prefix ? `${prefix}.${key}` : key
    if (typeof entry === 'string') out[path] = entry
    else Object.assign(out, flatten(entry, path))
  }
  return out
}

const ro = flatten(DICTIONARIES.ro)
const en = flatten(DICTIONARIES.en)

describe('dictionaries', () => {
  test('both locales resolve', () => {
    for (const locale of LOCALES) {
      expect(getDictionary(locale)).toBeDefined()
    }
  })

  test('the two dictionaries have identical keys', () => {
    expect(Object.keys(en).sort()).toEqual(Object.keys(ro).sort())
  })

  test('no string is empty or whitespace', () => {
    for (const [key, value] of Object.entries({ ...ro, ...en })) {
      expect(value.trim().length, `empty value at ${key}`).toBeGreaterThan(0)
    }
  })

  /**
   * Proper nouns and the two deliberate cross-language strings are expected to
   * match; everything else being identical usually means a key was stubbed
   * with the Romanian text and never translated.
   */
  test('English is actually translated, not copied', () => {
    const allowedIdentical = new Set([
      'site.name',
      'site.teamNumber',
      'team.instagram',
      // "Mentor" is the same word in Romanian and English.
      'team.branchMentor',
      // So is "Email" — Romanian borrows it unchanged.
      'contact.email',
      // Each dictionary carries the *other* language's invitation, in that
      // language — so these two are identical across locales on purpose.
      'language.switchTo',
      'language.switchToOther',
    ])

    const copied = Object.keys(ro).filter(
      (key) => !allowedIdentical.has(key) && ro[key] === en[key],
    )

    expect(copied).toEqual([])
  })

  test('the fallback note exists in both languages and differs', () => {
    expect(DICTIONARIES.ro.fallback.onlyRomanian).toContain('română')
    expect(DICTIONARIES.en.fallback.onlyRomanian).toContain('Romanian')
  })

  test('the switcher labels each point at the opposite language', () => {
    // Read by a screen reader before following the link, so they must be
    // written in the language being switched to (§11).
    expect(DICTIONARIES.en.language.switchTo).toContain('English')
    expect(DICTIONARIES.ro.language.switchTo).toContain('română')
  })
})
