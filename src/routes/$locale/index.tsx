import { createFileRoute } from '@tanstack/react-router'

import { getDictionary } from '@/i18n/dictionaries'
import { isLocale, DEFAULT_LOCALE } from '@/i18n/locale'
import { useDictionary } from '@/i18n/use-locale'

/**
 * Placeholder home page.
 *
 * Phase 4 builds the real one (hero, award strip, cached stats row, latest
 * news). This exists so `/ro` and `/en` resolve and the language system can be
 * exercised end to end.
 */
export const Route = createFileRoute('/$locale/')({
  head: ({ params }) => {
    const locale = isLocale(params.locale) ? params.locale : DEFAULT_LOCALE
    const dictionary = getDictionary(locale)
    return {
      meta: [
        { title: `${dictionary.site.name} — ${dictionary.site.teamNumber}` },
      ],
    }
  },
  component: Home,
})

function Home() {
  const dictionary = useDictionary()

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6">
      <h1 className="text-3xl font-semibold">{dictionary.site.name}</h1>
      <p className="text-branch-muted mt-2 max-w-measure">
        {dictionary.site.tagline}
      </p>
    </main>
  )
}
