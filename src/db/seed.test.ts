import { describe, expect, test } from 'bun:test'

import { PLACEHOLDER, buildSeedData } from './seed'
import {
  awardInsertSchema,
  homeSlideInsertSchema,
  newsPostInsertSchema,
  performanceEntryInsertSchema,
  qrCodeInsertSchema,
  seasonInsertSchema,
  sponsorInsertSchema,
  teamInfoInsertSchema,
  teamMemberInsertSchema,
} from './validation'

/**
 * Guards two things that are easy to erode over time: that every seed row is
 * actually insertable, and that the "invent nothing" discipline of CLAUDE.md
 * §13 still holds. A fabricated statistic on a Connect team's site is a real
 * problem, so this is a correctness test, not a style test.
 */

const data = buildSeedData()

describe('seed rows satisfy their insert schemas', () => {
  test('teamInfo', () => {
    expect(teamInfoInsertSchema.safeParse(data.teamInfo).success).toBe(true)
  })

  test('seasons', () => {
    for (const row of data.seasons) {
      expect(seasonInsertSchema.safeParse(row).success).toBe(true)
    }
  })

  test('awards', () => {
    // seasonSlug is swapped for a real uuid at insert time.
    for (const { seasonSlug: _s, ...rest } of data.awards) {
      const row = { ...rest, seasonId: '00000000-0000-4000-8000-000000000000' }
      expect(awardInsertSchema.safeParse(row).success).toBe(true)
    }
  })

  test('team members', () => {
    for (const row of data.members) {
      expect(teamMemberInsertSchema.safeParse(row).success).toBe(true)
    }
  })

  test('performance entries', () => {
    for (const row of data.performanceEntries) {
      expect(performanceEntryInsertSchema.safeParse(row).success).toBe(true)
    }
  })

  test('news posts', () => {
    for (const row of data.newsPosts) {
      expect(newsPostInsertSchema.safeParse(row).success).toBe(true)
    }
  })

  test('qr codes', () => {
    for (const row of data.qrCodes) {
      expect(qrCodeInsertSchema.safeParse(row).success).toBe(true)
    }
  })

  test('sponsors and home slides are empty but still typed', () => {
    for (const row of data.sponsors) {
      expect(sponsorInsertSchema.safeParse(row).success).toBe(true)
    }
    for (const row of data.homeSlides) {
      expect(homeSlideInsertSchema.safeParse(row).success).toBe(true)
    }
  })
})

describe('seed invents nothing', () => {
  test('no member carries a real-looking name', () => {
    for (const member of data.members) {
      expect(member.name).toBe(PLACEHOLDER)
    }
  })

  test('no sponsors — a sponsor name cannot be invented', () => {
    expect(data.sponsors).toHaveLength(0)
  })

  test('no home slides — they would need an image that does not exist', () => {
    expect(data.homeSlides).toHaveLength(0)
  })

  test('no performance entry claims a metric', () => {
    for (const entry of data.performanceEntries) {
      expect(entry.metrics).toBeNull()
    }
  })

  test('awards carry only the two results stated in CLAUDE.md §1', () => {
    expect(data.awards).toHaveLength(2)
    for (const a of data.awards) {
      expect(a.nameRo).toBe('Connect Award')
      expect(a.placement).toBeNull()
    }
  })

  test('award dates are the confirmed event dates', () => {
    const byEvent = new Map(data.awards.map((a) => [a.eventName, a.eventDate]))
    expect(byEvent.get('FTC Moldova Nationals 2025')).toBe('2025-04-05')
    expect(byEvent.get('FTC Moldova Nationals 2026 (DECODE)')).toBe('2026-02-21')
  })

  test('the contact email cannot reach a real inbox', () => {
    expect(data.teamInfo.contactEmail).toMatch(/@example\.(com|org|net)$/)
  })
})

describe('seed respects the privacy and draft rules', () => {
  test('every member has consent off and no photo (§8)', () => {
    for (const member of data.members) {
      expect(member.photoConsent).toBe(false)
      expect(member.fullNamePublic).toBe(false)
      expect(member.image).toBeNull()
    }
  })

  test('every news post is a draft, so nothing surfaces publicly (§10)', () => {
    for (const post of data.newsPosts) {
      expect(post.publishedAt).toBeNull()
    }
  })

  test('every QR target path is stored without a locale prefix (§6)', () => {
    for (const code of data.qrCodes) {
      expect(code.targetPath).toMatch(/^\//)
      expect(code.targetPath).not.toMatch(/^\/(ro|en)(\/|$)/)
    }
  })

  test('at most one season is marked current', () => {
    expect(data.seasons.filter((s) => s.isCurrent)).toHaveLength(1)
  })

  test('octet indices are in range (§7.5)', () => {
    for (const member of data.members) {
      expect(member.octetIndex).toBeGreaterThanOrEqual(0)
      expect(member.octetIndex).toBeLessThanOrEqual(255)
    }
  })
})
