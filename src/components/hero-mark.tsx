import { cn } from '@/lib/utils'

/**
 * The octopus mark as a hero watermark — CLAUDE.md §7.
 *
 * Two things make this work with the raster logo, which carries its own
 * near-black background:
 *
 * - **`mix-blend-mode: screen`** drops that background entirely against the
 *   ink ground. Screen leaves black untouched and only lightens, so what
 *   survives is the octopus, the wordmark and the dots — no square edge, no
 *   need for a transparent export.
 * - **18% opacity**, which is a measured ceiling rather than a guess. Against
 *   the brightest pixel of the mark the hero's text still measures 9.83:1
 *   (paper) and 7.40:1 (signal), comfortably past AA. The tagline had to move
 *   off `--branch-muted` to allow it: sage on ink starts at only 5.33:1 and a
 *   watermark of any useful strength pushed it under 4.5.
 *
 * Decorative and inert: `aria-hidden`, no pointer events, and absolutely
 * positioned so it can never affect layout or shift anything (§12).
 */
export function HeroMark({ className }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        'pointer-events-none absolute inset-0 overflow-hidden select-none',
        className,
      )}
    >
      <img
        src="/logo.webp"
        alt=""
        width={640}
        height={640}
        /* Loaded lazily and low priority: the LCP element is the heading, and
           a watermark must never compete with it for bandwidth (§12). */
        loading="lazy"
        fetchPriority="low"
        decoding="async"
        className={[
          'absolute opacity-[0.18] mix-blend-screen',
          // Mobile: large and bled off the right edge so the octopus reads
          // as a shape behind the text rather than a centred sticker.
          '-right-16 -top-8 w-[26rem] max-w-none',
          // Desktop: bigger, pushed further out, vertically centred on the
          // block so it sits behind the copy without crowding it.
          'sm:-right-24 sm:top-1/2 sm:w-[34rem] sm:-translate-y-1/2',
          'lg:-right-20 lg:w-[44rem]',
        ].join(' ')}
      />
    </div>
  )
}
