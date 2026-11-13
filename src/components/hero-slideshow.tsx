import { useCallback, useEffect, useRef, useState } from 'react'

import { usePrefersReducedMotion } from '@/hooks/use-prefers-reduced-motion'
import type { Locale } from '@/i18n/locale'
import { bilingual, getLocalized } from '@/i18n/localized'
import { useDictionary } from '@/i18n/use-locale'
import {
  nextSlideIndex,
  prevSlideIndex,
  slideIndexFromScroll,
} from '@/lib/carousel'
import { imageFitClass } from '@/lib/schemas'
import { cn } from '@/lib/utils'
import type { HomeData } from '@/server/home'

export type HeroSlide = HomeData['slides'][number]

const ADVANCE_MS = 6000
const DRAG_THRESHOLD_PX = 4

/**
 * The rotating hero — CLAUDE.md §4 calls for "rotating hero images (admin-
 * managed slides)".
 *
 * Slides sit side by side in a native horizontal scroll-snap track so touch
 * devices get compositor-smooth swiping and momentum out of the box, while
 * desktop supports trackpad/wheel scrolling, mouse dragging, dot buttons, and
 * arrow keys. Every slide stays mounted inside the fixed aspect-ratio box (§12)
 * so advancing never re-fetches images or triggers layout shift.
 *
 * Hovering, touching, focusing, or backgrounding the tab all pause autoplay,
 * and `prefers-reduced-motion` stops it outright (WCAG 2.2.2).
 *
 * The caption is NOT rendered here. It changes with the active slide but sits
 * outside this component's own layout (full width under the whole hero grid,
 * not just under the image column), so the active slide is reported upward
 * via `onActiveSlideChange` instead of drawing an overlay on the image.
 */
export function HeroSlideshow({
  slides,
  locale,
  onActiveSlideChange,
  className,
}: {
  slides: HeroSlide[]
  locale: Locale
  onActiveSlideChange?: (slide: HeroSlide) => void
  className?: string
}) {
  const dictionary = useDictionary()
  const reducedMotion = usePrefersReducedMotion()
  const [index, setIndex] = useState(0)
  const [paused, setPaused] = useState(false)
  const [isTouching, setIsTouching] = useState(false)
  const [isDragging, setIsDragging] = useState(false)

  const wrapperRef = useRef<HTMLDivElement>(null)
  const trackRef = useRef<HTMLDivElement>(null)
  const indexRef = useRef(0)
  const lastWidthRef = useRef(0)
  const programmaticTargetRef = useRef<number | null>(null)
  const dragRef = useRef<{
    pointerId: number
    startX: number
    startScrollLeft: number
    dragging: boolean
  } | null>(null)

  const goToSlide = useCallback(
    (target: number, instant = false) => {
      if (slides.length === 0) return
      const clamped = Math.max(0, Math.min(slides.length - 1, target))
      indexRef.current = clamped
      setIndex(clamped)

      const track = trackRef.current
      if (!track || track.clientWidth <= 0) return

      const targetLeft = clamped * track.clientWidth
      if (Math.abs(track.scrollLeft - targetLeft) <= 2) {
        programmaticTargetRef.current = null
        return
      }

      programmaticTargetRef.current = clamped
      track.scrollTo({
        left: targetLeft,
        behavior: instant || reducedMotion ? 'auto' : 'smooth',
      })
    },
    [reducedMotion, slides.length],
  )

  useEffect(() => {
    const clamped = Math.max(0, Math.min(slides.length - 1, index))
    if (clamped !== index) {
      indexRef.current = clamped
      setIndex(clamped)
    }
    const slide = slides[clamped]
    if (slide) onActiveSlideChange?.(slide)
  }, [index, slides, onActiveSlideChange])

  useEffect(() => {
    const track = trackRef.current
    if (!track) return
    lastWidthRef.current = track.clientWidth

    function handleScrollEnd() {
      programmaticTargetRef.current = null
    }

    track.addEventListener('scrollend', handleScrollEnd)

    if (typeof ResizeObserver === 'undefined') {
      return () => track.removeEventListener('scrollend', handleScrollEnd)
    }

    const observer = new ResizeObserver(() => {
      const width = track.clientWidth
      if (width <= 0 || width === lastWidthRef.current) return
      lastWidthRef.current = width
      programmaticTargetRef.current = indexRef.current
      track.scrollTo({ left: indexRef.current * width, behavior: 'auto' })
    })
    observer.observe(track)

    return () => {
      observer.disconnect()
      track.removeEventListener('scrollend', handleScrollEnd)
    }
  }, [])

  const autoplay =
    slides.length > 1 && !reducedMotion && !paused && !isTouching && !isDragging

  useEffect(() => {
    if (!autoplay) return

    const id = setInterval(() => {
      goToSlide(nextSlideIndex(indexRef.current, slides.length))
    }, ADVANCE_MS)

    return () => clearInterval(id)
  }, [autoplay, goToSlide, slides.length])

  // A backgrounded tab pauses rather than silently drifting out of sync, and
  // resumes cleanly instead of firing a burst of missed advances at once.
  useEffect(() => {
    function onVisibilityChange() {
      setPaused(document.visibilityState !== 'visible')
    }
    document.addEventListener('visibilitychange', onVisibilityChange)
    return () =>
      document.removeEventListener('visibilitychange', onVisibilityChange)
  }, [])

  function handleScroll() {
    const track = trackRef.current
    if (!track || track.clientWidth <= 0) return

    if (
      lastWidthRef.current > 0 &&
      track.clientWidth !== lastWidthRef.current
    ) {
      lastWidthRef.current = track.clientWidth
      programmaticTargetRef.current = indexRef.current
      track.scrollTo({
        left: indexRef.current * track.clientWidth,
        behavior: 'auto',
      })
      return
    }

    if (programmaticTargetRef.current !== null) {
      const targetLeft = programmaticTargetRef.current * track.clientWidth
      if (Math.abs(track.scrollLeft - targetLeft) <= 2) {
        programmaticTargetRef.current = null
      } else {
        return
      }
    }

    const next = slideIndexFromScroll(
      track.scrollLeft,
      track.clientWidth,
      slides.length,
    )
    if (next !== indexRef.current) {
      indexRef.current = next
      setIndex(next)
    }
  }

  function handlePointerDown(event: React.PointerEvent<HTMLDivElement>) {
    if (event.pointerType !== 'mouse' || event.button !== 0) return
    if (slides.length <= 1) return
    const track = trackRef.current
    if (!track) return

    programmaticTargetRef.current = null
    dragRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startScrollLeft: track.scrollLeft,
      dragging: false,
    }
  }

  function handlePointerMove(event: React.PointerEvent<HTMLDivElement>) {
    const drag = dragRef.current
    const track = trackRef.current
    if (!drag || !track || event.pointerId !== drag.pointerId) return

    const delta = event.clientX - drag.startX
    if (!drag.dragging) {
      if (Math.abs(delta) <= DRAG_THRESHOLD_PX) return
      drag.dragging = true
      setIsDragging(true)
      track.setPointerCapture(event.pointerId)
    }

    track.scrollLeft = drag.startScrollLeft - delta
  }

  function finishMouseDrag(event: React.PointerEvent<HTMLDivElement>) {
    const drag = dragRef.current
    const track = trackRef.current
    if (!drag || event.pointerId !== drag.pointerId) return

    const wasDragging = drag.dragging
    dragRef.current = null
    if (!wasDragging || !track) return

    if (track.hasPointerCapture(event.pointerId)) {
      track.releasePointerCapture(event.pointerId)
    }
    setIsDragging(false)
    goToSlide(
      slideIndexFromScroll(track.scrollLeft, track.clientWidth, slides.length),
    )
  }

  function handleTrackKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
    if (slides.length <= 1) return
    if (event.key === 'ArrowLeft') {
      event.preventDefault()
      goToSlide(prevSlideIndex(indexRef.current, slides.length))
    } else if (event.key === 'ArrowRight') {
      event.preventDefault()
      goToSlide(nextSlideIndex(indexRef.current, slides.length))
    }
  }

  function handleBlur(event: React.FocusEvent<HTMLDivElement>) {
    // Only resume once focus has actually left the component — moving
    // between two dots fires blur-then-focus on the same wrapper.
    if (!wrapperRef.current?.contains(event.relatedTarget)) {
      setPaused(false)
    }
  }

  if (slides.length === 0) return null

  return (
    <div
      ref={wrapperRef}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={handleBlur}
      className={className}
    >
      <div
        ref={trackRef}
        role="region"
        aria-roledescription="carousel"
        aria-label={dictionary.hero.slidesLabel}
        tabIndex={slides.length > 1 ? 0 : undefined}
        onScroll={handleScroll}
        onWheel={() => {
          programmaticTargetRef.current = null
        }}
        onTouchStart={() => {
          programmaticTargetRef.current = null
          setIsTouching(true)
        }}
        onTouchEnd={() => setIsTouching(false)}
        onTouchCancel={() => setIsTouching(false)}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={finishMouseDrag}
        onPointerCancel={finishMouseDrag}
        onKeyDown={handleTrackKeyDown}
        className={cn(
          'flex aspect-[4/3] w-full overflow-x-auto overflow-y-hidden overscroll-x-contain rounded-lg [scrollbar-width:none] [&::-webkit-scrollbar]:hidden',
          !isDragging && 'snap-x snap-mandatory',
          slides.length > 1 && (isDragging ? 'cursor-grabbing' : 'cursor-grab'),
        )}
      >
        {slides.map((slide, slideIndex) => {
          const alt = getLocalized(slide.image.alt, locale)?.value ?? ''
          const isActive = slideIndex === index

          return (
            <div
              key={slide.id}
              aria-hidden={isActive ? undefined : true}
              className="h-full w-full shrink-0 snap-center snap-always"
            >
              <img
                src={slide.image.url}
                alt={alt}
                width={slide.image.width}
                height={slide.image.height}
                loading="eager"
                // Only the first slide is a real LCP candidate — the rest load
                // promptly too (the carousel may need one within seconds) but
                // never compete with it for bandwidth priority.
                fetchPriority={slideIndex === 0 ? 'high' : 'low'}
                decoding="async"
                draggable={false}
                className={cn(
                  'h-full w-full select-none',
                  imageFitClass(slide.image),
                )}
              />
            </div>
          )
        })}
      </div>

      {slides.length > 1 ? (
        <div className="mt-2 flex justify-center gap-1">
          {slides.map((slide, slideIndex) => (
            <button
              key={slide.id}
              type="button"
              aria-label={`${dictionary.hero.goToSlide} ${slideIndex + 1}`}
              aria-current={slideIndex === index ? 'true' : undefined}
              onClick={() => goToSlide(slideIndex)}
              className="group flex size-7 cursor-pointer items-center justify-center rounded-full"
            >
              <span
                className={cn(
                  'size-2 rounded-full transition-colors',
                  slideIndex === index
                    ? 'bg-branch-accent'
                    : 'bg-branch-border group-hover:bg-branch-muted',
                )}
              />
            </button>
          ))}
        </div>
      ) : null}
    </div>
  )
}

/** The bilingual caption for whichever slide is currently active, if any. */
export function heroSlideCaption(slide: HeroSlide | undefined, locale: Locale) {
  return slide ? getLocalized(bilingual(slide, 'caption'), locale) : null
}
