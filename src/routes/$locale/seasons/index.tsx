import { Link, createFileRoute } from '@tanstack/react-router'

import { BranchTheme } from '@/components/branch-theme'
import { getDictionary } from '@/i18n/dictionaries'
import { formatMonthYear } from '@/i18n/format'
import { DEFAULT_LOCALE, isLocale } from '@/i18n/locale'
import { useDictionary, useLocale } from '@/i18n/use-locale'
import { getSeasons } from '@/server/seasons'

/**
 * Season index — CLAUDE.md §4. The archive a judge goes looking for.
 */
export const Route = createFileRoute('/$locale/seasons/')({
  loader: () => getSeasons(),
  head: ({ params }) => {
    const locale = isLocale(params.locale) ? params.locale : DEFAULT_LOCALE
    const dictionary = getDictionary(locale)
    return {
      meta: [{ title: `${dictionary.nav.seasons} — ${dictionary.site.name}` }],
    }
  },
  component: SeasonIndex,
  errorComponent: SeasonsError,
})

function SeasonIndex() {
  const seasons = Route.useLoaderData()
  const locale = useLocale()
  const dictionary = useDictionary()

  return (
    <BranchTheme branch="non_tech" as="main" className="min-h-screen">
      <div className="mx-auto w-full max-w-5xl space-y-8 px-4 py-10 sm:px-6">
        <h1 className="text-3xl font-semibold">{dictionary.nav.seasons}</h1>

        {seasons.length === 0 ? (
          <div className="border-branch-border max-w-measure rounded-md border border-dashed p-6">
            <p className="text-branch-muted">{dictionary.empty.seasons}</p>
          </div>
        ) : (
          <ul className="grid gap-6 sm:grid-cols-2">
            {seasons.map((season, index) => (
              <li key={season.slug}>
                <Link
                  to="/$locale/seasons/$slug"
                  params={{ locale, slug: season.slug }}
                  className="group block no-underline"
                >
                  {season.coverImage ? (
                    <img
                      src={season.coverImage.url}
                      alt=""
                      width={season.coverImage.width}
                      height={season.coverImage.height}
                      loading={index === 0 ? 'eager' : 'lazy'}
                      decoding="async"
                      className="aspect-[3/2] w-full rounded-md object-cover"
                    />
                  ) : (
                    <div className="bg-branch-surface aspect-[3/2] w-full rounded-md" />
                  )}

                  <div className="mt-3 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-xl font-semibold group-hover:underline">
                        {season.name}
                      </h2>
                      {season.isCurrent ? (
                        <span className="bg-branch-accent text-branch-accent-contrast rounded px-1.5 py-0.5 font-mono text-2xs font-semibold uppercase">
                          {dictionary.meta.season}
                        </span>
                      ) : null}
                    </div>
                    <p className="text-branch-muted text-sm">
                      {season.gameName}
                    </p>
                    <p className="branch-label text-branch-muted">
                      {formatMonthYear(season.startDate, locale)}
                      {season.endDate
                        ? ` — ${formatMonthYear(season.endDate, locale)}`
                        : ''}
                    </p>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </BranchTheme>
  )
}

function SeasonsError() {
  const dictionary = useDictionary()
  return (
    <BranchTheme branch="non_tech" as="main" className="min-h-screen">
      <div className="mx-auto w-full max-w-measure space-y-2 px-4 py-16 sm:px-6">
        <h1 className="text-2xl font-semibold">
          {dictionary.errors.serverTitle}
        </h1>
        <p className="text-branch-muted">{dictionary.errors.serverBody}</p>
      </div>
    </BranchTheme>
  )
}
