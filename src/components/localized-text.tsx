import type { ElementType, ReactNode } from 'react'

import { getDictionary } from '@/i18n/dictionaries'
import type { BilingualField } from '@/i18n/localized'
import { getLocalized } from '@/i18n/localized'
import { LOCALE_TAGS, type Locale } from '@/i18n/locale'
import { useLocale } from '@/i18n/use-locale'
import { cn } from '@/lib/utils'

/**
 * The content fallback — CLAUDE.md §5 and §11.
 *
 * One component, used everywhere a bilingual database field is rendered. When
 * English is missing it shows the Romanian text plus a quiet note saying so.
 * It never renders an empty block, and it never machine-translates.
 *
 * The `lang` attribute is set to the locale the text is *actually* written in,
 * not the locale of the page. That is what stops a screen reader from reading
 * Romanian with an English voice on a fallback page.
 */

/** The quiet note, on its own — for callers that render the value themselves. */
export function FallbackNote({
  locale,
  className,
}: {
  locale: Locale
  className?: string
}) {
  return (
    <p
      className={cn('text-branch-muted mt-1 text-xs italic', className)}
      // The note is written in the page's language, unlike the content above it.
      lang={locale}
    >
      {getDictionary(locale).fallback.onlyRomanian}
    </p>
  )
}

export type LocalizedTextProps = {
  field: BilingualField
  /** Defaults to the active locale. */
  locale?: Locale
  as?: ElementType
  className?: string
  noteClassName?: string
  /** Rendered when neither language has content. Defaults to nothing. */
  fallback?: ReactNode
  /** Suppresses the note — only for places with no room, e.g. a card title. */
  hideNote?: boolean
}

export function LocalizedText({
  field,
  locale,
  as: Component = 'p',
  className,
  noteClassName,
  fallback = null,
  hideNote = false,
}: LocalizedTextProps) {
  const activeLocale = useLocale()
  const resolved = locale ?? activeLocale
  const result = getLocalized(field, resolved)

  // Never render an empty block (§5).
  if (!result) return <>{fallback}</>

  return (
    <>
      <Component
        className={className}
        lang={
          result.resolvedLocale === resolved
            ? undefined
            : LOCALE_TAGS[result.resolvedLocale]
        }
      >
        {result.value}
      </Component>
      {result.isFallback && !hideNote ? (
        <FallbackNote locale={resolved} className={noteClassName} />
      ) : null}
    </>
  )
}

/**
 * Hook form, for callers that must render the value themselves — a markdown
 * body, or a value that goes into an attribute rather than a text node.
 * Pair it with `FallbackNote` so the note is not forgotten.
 */
export function useLocalizedField(field: BilingualField, locale?: Locale) {
  const activeLocale = useLocale()
  return getLocalized(field, locale ?? activeLocale)
}
