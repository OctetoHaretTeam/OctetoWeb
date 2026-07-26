import { useEffect, useRef, useState } from 'react'

import { cn } from '@/lib/utils'

/**
 * The team mark — CLAUDE.md §7.
 *
 * The artwork is a square lockup with the octopus over the wordmark. At header
 * size the words inside it are far too small to read, so the image is used as
 * a MARK and the readable wordmark stays as text beside it. That also keeps
 * the site name selectable, searchable and translatable, which an image is
 * not.
 *
 * TODO (§15.6): this is the raster export, which carries its own near-black
 * background. It sits on the ink header so the edges disappear, but a
 * transparent SVG would let the mark be used on the sage ground too.
 */
export function SiteLogo({ className }: { className?: string }) {
  const [failed, setFailed] = useState(false)
  const ref = useRef<HTMLImageElement>(null)

  // Same reason as the member photo: a server-rendered image can finish
  // failing before React hydrates, so `onError` alone would miss it.
  useEffect(() => {
    const node = ref.current
    if (node?.complete && node.naturalWidth === 0) setFailed(true)
  }, [])

  if (failed) return null

  return (
    <img
      ref={ref}
      src="/logo.webp"
      alt=""
      // Decorative: the wordmark beside it already names the team, so
      // announcing this too would just repeat it.
      aria-hidden="true"
      width={640}
      height={640}
      decoding="async"
      onError={() => setFailed(true)}
      className={cn('size-9 shrink-0 rounded-md object-cover', className)}
    />
  )
}
