import { Link, createFileRoute } from '@tanstack/react-router'

import { BranchTheme } from '@/components/branch-theme'
import {
  ONTON_POSES,
  OntonSticker,
  ontonPoseForSeed,
} from '@/components/onton'
import { getDictionary } from '@/i18n/dictionaries'
import { formatMonthYear } from '@/i18n/format'
import { DEFAULT_LOCALE, isLocale } from '@/i18n/locale'
import { useDictionary, useLocale } from '@/i18n/use-locale'
import { imageFitClass } from '@/lib/schemas'
import { buildPageMeta } from '@/lib/site'
import { cn } from '@/lib/utils'
import { getSeasons } from '@/server/seasons'

/**
 * Season index — CLAUDE.md §4. The archive a judge goes looking for.
 */
export const Route = createFileRoute('/$locale/seasons/')({
  loader: () => getSeasons(),
  head: ({ params }) => {
    const locale = isLocale(params.locale) ? params.locale : DEFAULT_LOCALE
    const dictionary = getDictionary(locale)
    const title = `${dictionary.nav.seasons} — ${dictionary.site.name} (${dictionary.site.teamNumber})`
    const description =
      locale === 'ro'
        ? `Arhiva de sezoane FIRST Tech Challenge a echipei ${dictionary.site.name} (Octeto / FTC #25474) din Chișinău.`
        : `FIRST Tech Challenge season archive of ${dictionary.site.name} (Octeto / FTC #25474) in Chișinău, Moldova.`

    return {
      meta: buildPageMeta({
        title,
        description,
        locale,
        pathname: `/${locale}/seasons`,
      }),
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
        <header className="flex flex-wrap items-center justify-between gap-6">
          <h1 className="text-3xl font-bold sm:text-4xl">
            {dictionary.nav.seasons}
          </h1>
          <OntonSticker
            pose="ball"
            locale={locale}
            size="lg"
            rotate={-6}
            floating
          />
        </header>

        {seasons.length === 0 ? (
          <div className="zine-card-paper flex items-center gap-4 rounded-2xl p-6 -rotate-1">
            <OntonSticker pose="huh" locale={locale} size="md" rotate={4} />
            <p className="text-branch-muted">{dictionary.empty.seasons}</p>
          </div>
        ) : (
          <ul className="grid gap-8 sm:grid-cols-2">
            {seasons.map((season, index) => {
              const fallbackPose = ontonPoseForSeed(season.slug)
              const fallbackSpec = ONTON_POSES[fallbackPose]
              const tilt = index % 2 === 0 ? -1.4 : 1.4

              return (
                <li
                  key={season.slug}
                  style={{ transform: `rotate(${tilt}deg)` }}
                  className="relative transition-transform duration-200 hover:rotate-0"
                >
                  <span
                    aria-hidden="true"
                    className="masking-tape pointer-events-none absolute -top-2.5 left-1/2 z-10 h-5 w-20 -translate-x-1/2"
                  />
                  <Link
                    to="/$locale/seasons/$slug"
                    params={{ locale, slug: season.slug }}
                    className="zine-card-paper group block rounded-2xl p-4 no-underline"
                  >
                    {season.coverImage ? (
                      <img
                        src={season.coverImage.url}
                        alt=""
                        width={season.coverImage.width}
                        height={season.coverImage.height}
                        loading={index === 0 ? 'eager' : 'lazy'}
                        decoding="async"
                        className={cn(
                          'aspect-[3/2] w-full rounded-xl',
                          imageFitClass(season.coverImage),
                        )}
                      />
                    ) : (
                      <div className="bg-sage/40 border-branch-border flex aspect-[3/2] w-full flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed p-6">
                        <img
                          src={fallbackSpec.src}
                          alt=""
                          aria-hidden="true"
                          width={fallbackSpec.width}
                          height={fallbackSpec.height}
                          loading={index < 2 ? 'eager' : 'lazy'}
                          decoding="async"
                          className="onton-sticker-shadow h-32 w-32 object-contain transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6"
                        />
                      </div>
                    )}

                    <div className="mt-4 space-y-1 px-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="text-xl font-bold group-hover:underline">
                          {season.name}
                        </h2>
                        {season.isCurrent ? (
                          <span className="bg-branch-accent text-branch-accent-contrast rounded-md px-2 py-0.5 font-mono text-2xs font-bold uppercase -rotate-2">
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
              )
            })}
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
