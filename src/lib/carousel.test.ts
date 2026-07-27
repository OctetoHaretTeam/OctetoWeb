import { describe, expect, test } from 'bun:test'

import { nextSlideIndex } from './carousel'

describe('nextSlideIndex', () => {
  test('advances by one', () => {
    expect(nextSlideIndex(0, 3)).toBe(1)
    expect(nextSlideIndex(1, 3)).toBe(2)
  })

  test('wraps from the last slide back to the first', () => {
    expect(nextSlideIndex(2, 3)).toBe(0)
  })

  test('a single slide always advances to itself', () => {
    expect(nextSlideIndex(0, 1)).toBe(0)
  })

  test('an empty slide list is safe', () => {
    expect(nextSlideIndex(0, 0)).toBe(0)
  })
})
