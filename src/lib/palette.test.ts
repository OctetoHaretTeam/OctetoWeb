import { describe, expect, test } from 'bun:test'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

import { performanceBranchEnum } from '@/db/schema'
import { BRANCHES, BRANCH_SLUGS, branchFromSlug, isBranch } from './branch'
import { BRAND_PALETTE, type BrandToken } from './palette'

const themeCss = readFileSync(
  fileURLToPath(new URL('../styles/theme.css', import.meta.url)),
  'utf8',
)

/**
 * `theme.css` is the single source of colour truth (CLAUDE.md §7.2).
 * `BRAND_PALETTE` duplicates it so contrast can be computed during SSR, so
 * this test exists to make that duplication safe.
 */
describe('palette mirrors theme.css', () => {
  for (const [token, hex] of Object.entries(BRAND_PALETTE)) {
    test(`--color-${token}`, () => {
      const match = themeCss.match(
        new RegExp(`--color-${token}\\s*:\\s*(#[0-9a-fA-F]{3,8})`),
      )
      expect(match?.[1]?.toLowerCase()).toBe(hex.toLowerCase())
    })
  }

  test('every --color-* token in the @theme block is mirrored', () => {
    const block = themeCss.slice(
      themeCss.indexOf('@theme static'),
      themeCss.indexOf('/* ── Branch grounds'),
    )
    const declared = [...block.matchAll(/--color-([a-z-]+)\s*:\s*#/g)].map(
      (m) => m[1] as BrandToken,
    )
    expect(declared.sort()).toEqual(
      (Object.keys(BRAND_PALETTE) as BrandToken[]).sort(),
    )
  })
})

/**
 * `Branch` is declared in `lib/branch.ts` rather than imported from the schema
 * so components do not pull Drizzle into the client bundle. This keeps the two
 * honest.
 */
describe('branch values match the database enum', () => {
  test('same members, same order', () => {
    expect([...BRANCHES]).toEqual([...performanceBranchEnum.enumValues])
  })

  test('every branch has a URL slug', () => {
    for (const branch of BRANCHES) {
      expect(BRANCH_SLUGS[branch]).toBeTruthy()
    }
  })

  test('slugs round-trip', () => {
    for (const branch of BRANCHES) {
      expect(branchFromSlug(BRANCH_SLUGS[branch])).toBe(branch)
    }
  })

  test('the non-tech URL segment is hyphenated, the database value is not', () => {
    expect(BRANCH_SLUGS.non_tech).toBe('non-tech')
    expect(branchFromSlug('non_tech')).toBeNull()
  })

  test('isBranch guards unknown input', () => {
    expect(isBranch('tech')).toBe(true)
    expect(isBranch('mentor')).toBe(false)
    expect(isBranch(null)).toBe(false)
  })
})
