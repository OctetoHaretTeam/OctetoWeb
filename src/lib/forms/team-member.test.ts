import { describe, expect, test } from 'bun:test'

import { teamMemberInsertSchema } from '@/db/validation'
import { teamMemberFormSchema } from './team-member'

/**
 * `teamMemberFormSchema` is hand-written pure Zod so the admin form does not
 * drag Drizzle into the client bundle. This test is what keeps that safe: a
 * value the form accepts must also be a valid insert against the real table.
 *
 * Tests are not bundled, so importing the drizzle-derived schema here costs
 * the browser nothing.
 */

const VALID = {
  slug: 'andrei',
  name: 'Andrei Popescu',
  roleRo: 'Programator',
  roleEn: 'Programmer',
  branch: 'tech' as const,
  descriptionRo: 'Scrie codul robotului.',
  descriptionEn: null,
  image: null,
  instagramUrl: null,
  octetIndex: 42,
  isActive: true,
  displayOrder: 0,
  photoConsent: false,
  fullNamePublic: false,
}

describe('the form schema stays compatible with the table', () => {
  test('a value the form accepts is a valid insert', () => {
    expect(teamMemberFormSchema.safeParse(VALID).success).toBe(true)
    expect(teamMemberInsertSchema.safeParse(VALID).success).toBe(true)
  })

  test('the two schemas agree on the editable field set', () => {
    const formKeys = Object.keys(teamMemberFormSchema.shape).sort()
    const tableKeys = Object.keys(teamMemberInsertSchema.shape)

    // Every form field must exist on the table. The table has more (id,
    // createdAt, updatedAt), which the form deliberately does not expose.
    for (const key of formKeys) {
      expect(tableKeys, `form field "${key}" is not a column`).toContain(key)
    }
  })

  test('the form does not expose columns it must never write', () => {
    const formKeys = Object.keys(teamMemberFormSchema.shape)
    for (const forbidden of ['id', 'createdAt', 'updatedAt']) {
      expect(formKeys).not.toContain(forbidden)
    }
  })
})

describe('the form schema refuses bad input', () => {
  test('a slug that is not lower-kebab', () => {
    for (const slug of ['Andrei', 'andrei popescu', '-andrei', 'andrei--x']) {
      expect(teamMemberFormSchema.safeParse({ ...VALID, slug }).success).toBe(
        false,
      )
    }
  })

  test('an octet index outside 0–255', () => {
    for (const octetIndex of [-1, 256, 1.5]) {
      expect(
        teamMemberFormSchema.safeParse({ ...VALID, octetIndex }).success,
      ).toBe(false)
    }
  })

  test('a branch outside the enum', () => {
    expect(
      teamMemberFormSchema.safeParse({ ...VALID, branch: 'coach' }).success,
    ).toBe(false)
  })

  test('a missing Romanian role, while English stays optional', () => {
    expect(
      teamMemberFormSchema.safeParse({ ...VALID, roleRo: '' }).success,
    ).toBe(false)
    expect(
      teamMemberFormSchema.safeParse({ ...VALID, roleEn: null }).success,
    ).toBe(true)
  })

  test('a non-URL Instagram link', () => {
    expect(
      teamMemberFormSchema.safeParse({ ...VALID, instagramUrl: 'nope' })
        .success,
    ).toBe(false)
  })

  test('consent flags must be explicit booleans, never omitted', () => {
    const { photoConsent: _p, ...withoutPhoto } = VALID
    expect(teamMemberFormSchema.safeParse(withoutPhoto).success).toBe(false)

    const { fullNamePublic: _n, ...withoutName } = VALID
    expect(teamMemberFormSchema.safeParse(withoutName).success).toBe(false)
  })
})
