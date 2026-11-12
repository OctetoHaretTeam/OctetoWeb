import { useEffect, useRef, useState } from 'react'

import { ONTON_POSES, ontonPoseForSeed } from '@/components/onton'
import { PaperCutout } from '@/components/paper-cutout'
import { getDictionary } from '@/i18n/dictionaries'
import { getLocalized } from '@/i18n/localized'
import type { Locale } from '@/i18n/locale'
import { type ImageAsset, imageFitClass } from '@/lib/schemas'
import { cn } from '@/lib/utils'

export function MemberPhoto({
  image,
  displayName: _displayName,
  locale,
  seed,
  priority = false,
  className,
}: {
  image: ImageAsset | null
  displayName?: string
  locale: Locale
  /** Stable per member — the slug, so the tear never changes. */
  seed: string
  /** Set on the LCP image only (§12). */
  priority?: boolean
  className?: string
}) {
  const dictionary = getDictionary(locale)

  const [failed, setFailed] = useState(false)
  const imageRef = useRef<HTMLImageElement>(null)

  useEffect(() => {
    const node = imageRef.current
    if (node?.complete && node.naturalWidth === 0) setFailed(true)
  }, [image?.url])

  const showImage = image !== null && !failed
  const fallbackPose = ontonPoseForSeed(seed)
  const fallbackSpec = ONTON_POSES[fallbackPose]

  return (
    <PaperCutout seed={seed} className={cn('aspect-square w-full', className)}>
      {showImage ? (
        <img
          ref={imageRef}
          src={image.url}
          alt={getLocalized(image.alt, locale)?.value ?? ''}
          width={image.width}
          height={image.height}
          loading={priority ? 'eager' : 'lazy'}
          fetchPriority={priority ? 'high' : 'auto'}
          decoding="async"
          onError={() => setFailed(true)}
          className={cn('h-full w-full', imageFitClass(image))}
        />
      ) : (
        <div
          className="bg-branch-surface relative flex h-full w-full items-center justify-center p-4"
          role="img"
          aria-label={dictionary.team.noPhoto}
        >
          <img
            src={fallbackSpec.src}
            alt=""
            aria-hidden="true"
            width={fallbackSpec.width}
            height={fallbackSpec.height}
            loading={priority ? 'eager' : 'lazy'}
            decoding="async"
            className="onton-sticker-shadow max-h-[82%] max-w-[82%] object-contain transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-3"
          />
        </div>
      )}
    </PaperCutout>
  )
}
