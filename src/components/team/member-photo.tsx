import { useState } from 'react'

import { PaperCutout } from '@/components/paper-cutout'
import { getDictionary } from '@/i18n/dictionaries'
import { getLocalized } from '@/i18n/localized'
import type { Locale } from '@/i18n/locale'
import type { ImageAsset } from '@/lib/schemas'
import { cn } from '@/lib/utils'

/**
 * A member's photograph, or the placeholder when there is none to show.
 *
 * There is no consent check here on purpose. `photoConsent` is applied on the
 * server (`src/server/team.ts`), so by the time a photo reaches this component
 * it is already one the site is allowed to display — and a withheld one was
 * never serialised into the page at all (CLAUDE.md §8).
 *
 * The box is the same size whether the photo loads, fails, or is absent, which
 * is what keeps CLS at zero (§12).
 */
export function MemberPhoto({
  image,
  displayName,
  locale,
  seed,
  priority = false,
  className,
}: {
  image: ImageAsset | null
  displayName: string
  locale: Locale
  /** Stable per member — the slug, so the tear never changes. */
  seed: string
  /** Set on the LCP image only (§12). */
  priority?: boolean
  className?: string
}) {
  const dictionary = getDictionary(locale)

  /*
   * A stored URL can outlive its file — a row edited before an upload
   * finished, or storage swapped underneath it. Falling back to the
   * placeholder keeps a person's card intact instead of showing a broken
   * image icon where their photograph should be.
   */
  const [failed, setFailed] = useState(false)
  const showImage = image !== null && !failed

  return (
    <PaperCutout seed={seed} className={cn('aspect-square w-full', className)}>
      {showImage ? (
        <img
          src={image.url}
          // Alt text is bilingual and falls back like any other field.
          alt={getLocalized(image.alt, locale)?.value ?? ''}
          width={image.width}
          height={image.height}
          loading={priority ? 'eager' : 'lazy'}
          fetchPriority={priority ? 'high' : 'auto'}
          decoding="async"
          onError={() => setFailed(true)}
          className="h-full w-full object-cover"
        />
      ) : (
        <div
          className="bg-branch-surface flex h-full w-full items-center justify-center"
          // Not decorative: it stands in for a person, so it is announced.
          role="img"
          aria-label={dictionary.team.noPhoto}
        >
          <span
            aria-hidden="true"
            className="text-branch-muted font-display text-4xl font-black"
          >
            {firstInitial(displayName)}
          </span>
        </div>
      )}
    </PaperCutout>
  )
}

/** First initial of the name the site is allowed to show. */
function firstInitial(displayName: string): string {
  const first = displayName.trim().split(/\s+/)[0] ?? ''
  return Array.from(first)[0]?.toLocaleUpperCase('ro-MD') ?? '·'
}
