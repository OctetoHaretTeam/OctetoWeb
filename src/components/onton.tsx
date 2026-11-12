import { useLocation } from '@tanstack/react-router'
import { useEffect, useState } from 'react'

import type { Locale } from '@/i18n/locale'
import { hashSeed } from '@/lib/torn-edge'
import { cn } from '@/lib/utils'

export type OntonPose =
  | 'ball'
  | 'french'
  | 'muchacho'
  | 'cofe'
  | 'watahel'
  | 'huh'
  | 'high'
  | 'demolisher'
  | 'blob'
  | 'cai-verzi'
  | 'squish'

export type OntonSpec = {
  id: OntonPose
  src: string
  width: number
  height: number
}

export const ONTON_POSES: Record<OntonPose, OntonSpec> = {
  ball: {
    id: 'ball',
    src: '/onton/onton-ball.webp',
    width: 503,
    height: 640,
  },
  french: {
    id: 'french',
    src: '/onton/onton-french.webp',
    width: 640,
    height: 468,
  },
  muchacho: {
    id: 'muchacho',
    src: '/onton/onton-muchacho.webp',
    width: 640,
    height: 555,
  },
  cofe: {
    id: 'cofe',
    src: '/onton/onton-cofe.webp',
    width: 640,
    height: 618,
  },
  watahel: {
    id: 'watahel',
    src: '/onton/onton-watahel.webp',
    width: 508,
    height: 640,
  },
  huh: {
    id: 'huh',
    src: '/onton/onton-huh.webp',
    width: 640,
    height: 428,
  },
  high: {
    id: 'high',
    src: '/onton/onton-high.webp',
    width: 471,
    height: 640,
  },
  demolisher: {
    id: 'demolisher',
    src: '/onton/onton-demolisher.webp',
    width: 638,
    height: 613,
  },
  blob: {
    id: 'blob',
    src: '/onton/onton-blob.webp',
    width: 579,
    height: 555,
  },
  'cai-verzi': {
    id: 'cai-verzi',
    src: '/onton/onton-cai-verzi.webp',
    width: 584,
    height: 405,
  },
  squish: {
    id: 'squish',
    src: '/onton/onton-squish.webp',
    width: 640,
    height: 534,
  },
}

const ALL_POSES = Object.keys(ONTON_POSES) as OntonPose[]

export const ONTON_POSE_LIST: OntonSpec[] = ALL_POSES.map(
  (pose) => ONTON_POSES[pose],
)

/** Deterministically picks a mascot pose from any string or number seed. */
export function ontonPoseForSeed(seed: string | number): OntonPose {
  const index = hashSeed(String(seed)) % ALL_POSES.length
  return ALL_POSES[index] ?? 'ball'
}

export type OntonStickerProps = {
  pose: OntonPose
  locale?: Locale
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  rotate?: number
  floating?: boolean
  className?: string
}

/**
 * Purely visual die-cut mascot sticker.
 *
 * Renders with zero text, zero speech bubbles, and zero captions. Clicking the
 * sticker makes the mascot wiggle and cycle through poses silently.
 */
export function OntonSticker({
  pose,
  size = 'md',
  rotate = 0,
  floating = true,
  className,
}: OntonStickerProps) {
  const [currentPose, setCurrentPose] = useState<OntonPose>(pose)
  const [wiggling, setWiggling] = useState(false)

  useEffect(() => {
    setCurrentPose(pose)
  }, [pose])

  const spec = ONTON_POSES[currentPose] ?? ONTON_POSES.ball

  const sizeClasses = {
    xs: 'w-12 sm:w-14',
    sm: 'w-20 sm:w-24',
    md: 'w-28 sm:w-36',
    lg: 'w-36 sm:w-48',
    xl: 'w-44 sm:w-60 lg:w-68',
  }[size]

  function handlePoke() {
    setWiggling(true)
    setCurrentPose((prev) => {
      const idx = ALL_POSES.indexOf(prev)
      return ALL_POSES[(idx + 1) % ALL_POSES.length] ?? 'ball'
    })
    window.setTimeout(() => setWiggling(false), 560)
  }

  return (
    <div
      aria-hidden="true"
      className={cn(
        'relative inline-flex flex-col items-center select-none',
        className,
      )}
      style={{ '--onton-rot': `${rotate}deg` } as React.CSSProperties}
    >
      <button
        type="button"
        tabIndex={-1}
        onClick={handlePoke}
        className={cn(
          'group relative cursor-pointer border-0 bg-transparent p-0 transition-transform duration-200 hover:scale-105',
          floating && !wiggling && 'animate-onton-float',
          wiggling && 'animate-onton-wiggle',
        )}
        style={{ transform: `rotate(${rotate}deg)` }}
      >
        <img
          src={spec.src}
          alt=""
          width={spec.width}
          height={spec.height}
          loading="lazy"
          decoding="async"
          className={cn(
            'onton-sticker-shadow h-auto object-contain transition-transform',
            sizeClasses,
          )}
        />
      </button>
    </div>
  )
}

/**
 * Purely visual floating mascot companion in the bottom-right corner.
 *
 * Syncs its default pose with the active route and silently wiggles + cycles
 * through all mascot poses on click — with zero speech bubbles or text.
 */
export function OntonMascotDock({
  className,
}: {
  locale?: Locale
  className?: string
}) {
  const location = useLocation()
  const routePose = defaultPoseForPath(location.pathname)

  const [poseIndex, setPoseIndex] = useState<number>(() =>
    Math.max(0, ALL_POSES.indexOf(routePose)),
  )
  const [wiggling, setWiggling] = useState(false)

  useEffect(() => {
    const idx = ALL_POSES.indexOf(defaultPoseForPath(location.pathname))
    if (idx !== -1) {
      setPoseIndex(idx)
    }
  }, [location.pathname])

  const currentPose = ALL_POSES[poseIndex % ALL_POSES.length] ?? 'ball'
  const spec = ONTON_POSES[currentPose]

  function handleMascotClick() {
    setWiggling(true)
    setPoseIndex((p) => (p + 1) % ALL_POSES.length)
    window.setTimeout(() => setWiggling(false), 560)
  }

  return (
    <div
      aria-hidden="true"
      className={cn(
        'pointer-events-none fixed right-3 bottom-3 z-40 flex items-end sm:right-5 sm:bottom-5',
        className,
      )}
    >
      <button
        type="button"
        tabIndex={-1}
        onClick={handleMascotClick}
        className={cn(
          'pointer-events-auto group relative cursor-pointer border-0 bg-transparent p-0 transition-transform hover:scale-110',
          !wiggling && 'animate-onton-float',
          wiggling && 'animate-onton-wiggle',
        )}
        style={{ '--onton-rot': '-4deg' } as React.CSSProperties}
      >
        <img
          src={spec.src}
          alt=""
          width={spec.width}
          height={spec.height}
          loading="lazy"
          decoding="async"
          className="onton-sticker-shadow h-auto w-16 object-contain sm:w-20"
        />
      </button>
    </div>
  )
}

function defaultPoseForPath(pathname: string): OntonPose {
  if (pathname.includes('/performance/tech')) return 'demolisher'
  if (pathname.includes('/performance/non-tech')) return 'french'
  if (pathname.includes('/performance')) return 'demolisher'
  if (pathname.includes('/team')) return 'squish'
  if (pathname.includes('/seasons')) return 'high'
  if (pathname.includes('/sponsors')) return 'muchacho'
  if (pathname.includes('/news')) return 'cofe'
  if (pathname.includes('/about')) return 'cai-verzi'
  return 'ball'
}

/**
 * 8-bit binary octet badge — CLAUDE.md §7.5, with organic hand-cut squares.
 */
export function OctetBits({
  octetIndex = 0b10100101,
  className,
}: {
  octetIndex?: number | null
  className?: string
}) {
  const resolved = octetIndex ?? 0b10100101
  const clamped = Math.max(0, Math.min(255, resolved))
  const bits = Array.from(
    { length: 8 },
    (_, i) => ((clamped >> (7 - i)) & 1) === 1,
  )

  return (
    <span
      aria-label={`Octet #${clamped}`}
      title={`Octet #${clamped} (${bits.map((b) => (b ? '1' : '0')).join('')})`}
      className={cn('inline-flex items-center gap-1', className)}
    >
      {bits.map((on, idx) => (
        <span
          key={idx}
          aria-hidden="true"
          className={cn(
            'inline-block size-2.5 border border-current transition-transform duration-150 group-hover:scale-110',
            idx % 2 === 0
              ? 'rotate-3 rounded-[2px]'
              : '-rotate-3 rounded-[3px]',
            on ? 'bg-current' : 'bg-transparent opacity-45',
          )}
        />
      ))}
    </span>
  )
}
