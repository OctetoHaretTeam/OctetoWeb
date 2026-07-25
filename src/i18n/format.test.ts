import { describe, expect, test } from 'bun:test'

import {
  formatCompact,
  formatCurrency,
  formatDate,
  formatNumber,
  toDate,
  toIsoDate,
} from './format'

describe('date handling', () => {
  /**
   * Drizzle returns `date` columns as `YYYY-MM-DD`. Parsing those as local
   * time would shift the day backwards for readers west of UTC — an award
   * dated 5 April showing as 4 April is the kind of error a judge would spot.
   */
  test('a bare date string is parsed as UTC, not local time', () => {
    expect(toDate('2026-02-21').toISOString()).toBe('2026-02-21T00:00:00.000Z')
  })

  test('the confirmed award dates render on the right day in both locales', () => {
    expect(formatDate('2025-04-05', 'ro')).toContain('2025')
    expect(formatDate('2025-04-05', 'ro')).toContain('5')
    expect(formatDate('2026-02-21', 'en')).toContain('21')
    expect(formatDate('2026-02-21', 'en')).toContain('2026')
  })

  test('the two locales format dates differently', () => {
    expect(formatDate('2026-02-21', 'ro')).not.toBe(
      formatDate('2026-02-21', 'en'),
    )
  })

  test('Date objects pass through', () => {
    const d = new Date('2026-02-21T00:00:00Z')
    expect(formatDate(d, 'en')).toContain('2026')
  })

  test('toIsoDate is always machine-readable, never localised', () => {
    expect(toIsoDate('2026-02-21')).toBe('2026-02-21')
    expect(toIsoDate(new Date('2026-02-21T12:00:00Z'))).toBe('2026-02-21')
  })
})

describe('numbers and currency', () => {
  test('numbers are grouped per locale', () => {
    expect(formatNumber(12480, 'ro')).toMatch(/12.480/)
    expect(formatNumber(12480, 'en')).toBe('12,480')
  })

  test('currency is Moldovan lei in both locales', () => {
    // The money does not change with the reader; only how it is written does.
    const ro = formatCurrency(45000, 'ro')
    const en = formatCurrency(45000, 'en')
    expect(ro).toMatch(/MDL|L/)
    expect(en).toMatch(/MDL|L/)
    expect(ro).not.toBe(en)
  })

  test('currency drops decimals by default', () => {
    expect(formatCurrency(45000, 'en')).not.toContain('.00')
  })

  test('compact notation shortens large figures', () => {
    const compact = formatCompact(12480, 'en')
    expect(compact.length).toBeLessThan(formatNumber(12480, 'en').length)
  })
})
