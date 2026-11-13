import { describe, expect, test } from 'bun:test'

import {
  nextSlideIndex,
  prevSlideIndex,
  slideIndexFromScroll,
} from './carousel'

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

describe('prevSlideIndex', () => {
  test('steps back by one', () => {
    expect(prevSlideIndex(2, 3)).toBe(1)
    expect(prevSlideIndex(1, 3)).toBe(0)
  })

  test('wraps from the first slide back to the last', () => {
    expect(prevSlideIndex(0, 3)).toBe(2)
  })

  test('a single slide always steps to itself', () => {
    expect(prevSlideIndex(0, 1)).toBe(0)
  })

  test('an empty slide list is safe', () => {
    expect(prevSlideIndex(0, 0)).toBe(0)
  })
})

describe('slideIndexFromScroll', () => {
  test('snaps to nearest slide index', () => {
    expect(slideIndexFromScroll(0, 400, 3)).toBe(0)
    expect(slideIndexFromScroll(199, 400, 3)).toBe(0)
    expect(slideIndexFromScroll(200, 400, 3)).toBe(1)
    expect(slideIndexFromScroll(410, 400, 3)).toBe(1)
    expect(slideIndexFromScroll(790, 400, 3)).toBe(2)
  })

  test('clamps overscroll at both ends', () => {
    expect(slideIndexFromScroll(-60, 400, 3)).toBe(0)
    expect(slideIndexFromScroll(1500, 400, 3)).toBe(2)
  })

  test('handles zero width or single slide safely', () => {
    expect(slideIndexFromScroll(200, 0, 3)).toBe(0)
    expect(slideIndexFromScroll(200, 400, 1)).toBe(0)
    expect(slideIndexFromScroll(200, 400, 0)).toBe(0)
  })
})
