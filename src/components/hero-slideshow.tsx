import { useEffect, useRef, useState } from 'react'

import { usePrefersReducedMotion } from '@/hooks/use-prefers-reduced-motion'
import type { Locale } from '@/i18n/locale'
import { bilingual, getLocalized } from '@/i18n/localized'
import { useDictionary } from '@/i18n/use-locale'
import { nextSlideIndex } from '@/lib/carousel'
import { cn } from '@/lib/utils'
import type { HomeData } from '@/server/home'

export type HeroSlide = HomeData['slides'][number]

const ADVANCE_MS = 6000

/**
 * The rotating hero — CLAUDE.md §4 calls for "rotating hero images (admin-
 * managed slides)". Until now only the first one ever rendered (`slides[0]`,
 * with no timer, no carousel, anywhere in the codebase) — this is the actual
 * rotation.
 *
 * Every slide is mounted at once and crossfaded via opacity rather than
 * swapped in and out of the DOM, so advancing never re-fetches an image that
 * already loaded. The wrapper's fixed aspect ratio reserves the box up front
 * (§12) — slides come from separate admin uploads with no guaranteed common
 * size, so sizing off any one image's own `width`/`height` would risk a
 * layout shift the moment the carousel advances to a differently-shaped one.
 *
 * No explicit pause/stop button: hovering, focusing a dot, or backgrounding
 * the tab all pause it, and `prefers-reduced-motion` stops it outright, which
 * together cover WCAG 2.2.2 (Pause, Stop, Hide) without adding a control
 * surface to what is otherwise a marketing photo.
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
  const wrapperRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const slide = slides[index]
    if (slide) onActiveSlideChange?.(slide)
  }, [index, slides, onActiveSlideChange])

  /*
   * The crossfade is already forced to ~0ms sitewide under
   * `prefers-reduced-motion: reduce` (app.css), so a manual dot click still
   * works, just without the fade. What that global rule cannot stop is the
   * TIMER — content that keeps changing on its own is motion no
   * transition-duration override touches, so the interval is gated here.
   */
  const autoplay = slides.length > 1 && !reducedMotion && !paused

  useEffect(() => {
    if (!autoplay) return

    const id = setInterval(() => {
      setIndex((current) => nextSlideIndex(current, slides.length))
    }, ADVANCE_MS)

    return () => clearInterval(id)
  }, [autoplay, slides.length])

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
      <div className="relative aspect-[4/3] w-full overflow-hidden rounded-lg">
        {slides.map((slide, slideIndex) => {
          const alt = getLocalized(slide.image.alt, locale)?.value ?? ''
          const isActive = slideIndex === index

          return (
            <img
              key={slide.id}
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
              // The hidden slides are pre-loaded, not present as far as
              // assistive tech is concerned — a screen reader should never
              // land on a photo that isn't actually showing.
              aria-hidden={isActive ? undefined : true}
              className={cn(
                'absolute inset-0 h-full w-full object-cover transition-opacity duration-700',
                isActive ? 'opacity-100' : 'opacity-0',
              )}
            />
          )
        })}
      </div>

      {slides.length > 1 ? (
        <div className="mt-3 flex justify-center gap-2">
          {slides.map((slide, slideIndex) => (
            <button
              key={slide.id}
              type="button"
              aria-label={`${dictionary.hero.goToSlide} ${slideIndex + 1}`}
              aria-current={slideIndex === index ? 'true' : undefined}
              onClick={() => setIndex(slideIndex)}
              className={cn(
                'size-2 rounded-full transition-colors',
                slideIndex === index
                  ? 'bg-branch-accent'
                  : 'bg-branch-border hover:bg-branch-muted',
              )}
            />
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
