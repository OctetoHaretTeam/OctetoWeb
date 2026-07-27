import { useEffect, useState } from 'react'

const QUERY = '(prefers-reduced-motion: reduce)'

/**
 * CLAUDE.md §7.7 — honoured on every animation, no exceptions.
 *
 * This is the one case that needs the preference in JS rather than CSS: an
 * auto-advancing carousel is motion the global `prefers-reduced-motion`
 * stylesheet rule cannot stop on its own. That rule forces transitions to
 * ~0ms, which makes a slide change instant instead of a crossfade — but the
 * content still changes every few seconds on its own. Stopping that requires
 * knowing the preference where the timer lives.
 *
 * Defaults to `false` so the server render and the first client render agree
 * — reading the real value only after mount avoids a hydration mismatch, at
 * the cost of a brief window where a reduced-motion visitor could see one
 * slide change before the effect runs. That trade is deliberate: guessing the
 * preference during SSR risks the opposite failure, a slideshow stuck on one
 * frame for a visitor who never asked for reduced motion.
 */
export function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false)

  useEffect(() => {
    const media = window.matchMedia(QUERY)
    setReduced(media.matches)

    function onChange(event: MediaQueryListEvent) {
      setReduced(event.matches)
    }

    media.addEventListener('change', onChange)
    return () => media.removeEventListener('change', onChange)
  }, [])

  return reduced
}
