import { describe, expect, test } from 'bun:test'

import { isSessionFresh } from './session'

const EIGHT_HOURS = 8 * 60 * 60
const NOW = 1_800_000_000_000

/**
 * The 8-hour sliding window (CLAUDE.md §9). `lastSeenAt` is refreshed on every
 * authenticated request, so this decides when an idle session lapses.
 */
describe('isSessionFresh', () => {
  test('a session just used is fresh', () => {
    expect(isSessionFresh({ lastSeenAt: NOW }, EIGHT_HOURS, NOW)).toBe(true)
  })

  test('a session used within the window is fresh', () => {
    const sevenHoursAgo = NOW - 7 * 60 * 60 * 1000
    expect(isSessionFresh({ lastSeenAt: sevenHoursAgo }, EIGHT_HOURS, NOW)).toBe(
      true,
    )
  })

  test('exactly at the boundary is still fresh', () => {
    const exactly = NOW - EIGHT_HOURS * 1000
    expect(isSessionFresh({ lastSeenAt: exactly }, EIGHT_HOURS, NOW)).toBe(true)
  })

  test('one second past the window has lapsed', () => {
    const justOver = NOW - (EIGHT_HOURS + 1) * 1000
    expect(isSessionFresh({ lastSeenAt: justOver }, EIGHT_HOURS, NOW)).toBe(
      false,
    )
  })

  test('a long-idle session has lapsed', () => {
    const yesterday = NOW - 24 * 60 * 60 * 1000
    expect(isSessionFresh({ lastSeenAt: yesterday }, EIGHT_HOURS, NOW)).toBe(
      false,
    )
  })

  test('a timestamp in the future is refused, not trusted', () => {
    // A tampered or clock-skewed cookie must not buy extra lifetime.
    const future = NOW + 60 * 60 * 1000
    expect(isSessionFresh({ lastSeenAt: future }, EIGHT_HOURS, NOW)).toBe(false)
  })

  test('a missing or malformed session is refused', () => {
    expect(isSessionFresh(undefined, EIGHT_HOURS, NOW)).toBe(false)
    expect(isSessionFresh(null, EIGHT_HOURS, NOW)).toBe(false)
    expect(isSessionFresh({}, EIGHT_HOURS, NOW)).toBe(false)
    expect(isSessionFresh({ lastSeenAt: 0 }, EIGHT_HOURS, NOW)).toBe(false)
  })

  test('a shorter configured lifetime is honoured', () => {
    const oneHour = 60 * 60
    const twoHoursAgo = NOW - 2 * 60 * 60 * 1000
    expect(isSessionFresh({ lastSeenAt: twoHoursAgo }, oneHour, NOW)).toBe(false)
  })
})
