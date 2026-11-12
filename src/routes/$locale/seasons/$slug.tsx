import { ArrowLeft, FileText } from 'lucide-react'
import { Link, createFileRoute, notFound } from '@tanstack/react-router'

import { BranchTheme } from '@/components/branch-theme'
import { FallbackNote } from '@/components/localized-text'
import { OntonSticker, ontonPoseForSeed } from '@/components/onton'
import { getDictionary } from '@/i18n/dictionaries'
import { formatDate, formatMonthYear, toIsoDate } from '@/i18n/format'
import { bilingual, getLocalized } from '@/i18n/localized'
import { DEFAULT_LOCALE, isLocale } from '@/i18n/locale'
import { useDictionary, useLocale } from '@/i18n/use-locale'
import { imageFitClass } from '@/lib/schemas'
import { buildPageMeta } from '@/lib/site'
import { cn } from '@/lib/utils'
import { getSeason } from '@/server/seasons'

/**
 * A season — description, gallery, awards and the portfolio PDF (CLAUDE.md §4).
 * This is the archive view judges look for.
 */
export const Route = createFileRoute('/$locale/seasons/$slug')({
  loader: async ({ params }) => {
    const season = await getSeason({ data: { slug: params.slug } })
    if (!season) throw notFound()
    return season
  },
  head: ({ params, loaderData }) => {
    const locale = isLocale(params.locale) ? params.locale : DEFAULT_LOCALE
    const dictionary = getDictionary(locale)
    if (!loaderData) {
      return {
        meta: buildPageMeta({
          title: `${dictionary.nav.seasons} — ${dictionary.site.name}`,
          description: dictionary.site.tagline,
          locale,
          pathname: `/${locale}/seasons/${params.slug}`,
        }),
      }
    }

    const title = `${loaderData.name} — ${loaderData.gameName}`
    const description = `${loaderData.name} (${loaderData.gameName}) — ${dictionary.site.name} (${dictionary.site.teamNumber}).`

    return {
      meta: buildPageMeta({
        title: `${title} — ${dictionary.site.name}`,
        description,
        locale,
        pathname: `/${locale}/seasons/${loaderData.slug}`,
        image: loaderData.coverImage?.url,
        imageAlt: title,
      }),
    }
  },
  component: SeasonDetail,
  notFoundComponent: SeasonNotFound,
  errorComponent: SeasonError,
})

function SeasonDetail() {
  const season = Route.useLoaderData()
  const locale = useLocale()
  const dictionary = useDictionary()

  const description = season.descriptionHtml[locale] ?? season.descriptionHtml.ro
  const isFallback = season.descriptionHtml[locale] === null
  const pose = ontonPoseForSeed(season.slug)

  return (
    <BranchTheme branch="non_tech" as="main" className="min-h-screen">
      <div className="mx-auto w-full max-w-4xl space-y-8 px-4 py-8 sm:px-6">
        <Link
          to="/$locale/seasons"
          params={{ locale }}
          className="text-branch-muted hover:text-branch-text inline-flex items-center gap-1.5 text-sm no-underline"
        >
          <ArrowLeft aria-hidden="true" className="size-4" />
          {dictionary.nav.seasons}
        </Link>

        <header className="flex flex-wrap items-center justify-between gap-6">
          <div className="space-y-2">
            <p className="branch-label text-branch-muted">
              {formatMonthYear(season.startDate, locale)}
              {season.endDate
                ? ` — ${formatMonthYear(season.endDate, locale)}`
                : ''}
            </p>
            <h1 className="text-3xl font-bold sm:text-5xl">{season.name}</h1>
            <p className="text-branch-muted text-lg">{season.gameName}</p>
          </div>
          <OntonSticker
            pose={pose}
            locale={locale}
            size="lg"
            rotate={5}
            floating
          />
        </header>

        {season.coverImage ? (
          <img
            src={season.coverImage.url}
            alt={getLocalized(season.coverImage.alt, locale)?.value ?? ''}
            width={season.coverImage.width}
            height={season.coverImage.height}
            fetchPriority="high"
            decoding="async"
            className={cn(
              'zine-card-paper aspect-[3/2] w-full rounded-2xl',
              imageFitClass(season.coverImage),
            )}
          />
        ) : null}

        <div className="zine-card-paper masking-tape relative rounded-2xl p-6 sm:p-8 -rotate-0.5">
          <div
            className="prose-body max-w-measure"
            lang={isFallback ? 'ro' : undefined}
            dangerouslySetInnerHTML={{ __html: description }}
          />
          {isFallback ? <FallbackNote locale={locale} /> : null}
        </div>

        {season.portfolioUrl ? (
          <a
            href={season.portfolioUrl}
            target="_blank"
            rel="noreferrer noopener"
            className="zine-btn bg-branch-accent text-branch-accent-contrast inline-flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-bold no-underline -rotate-1"
          >
            <FileText aria-hidden="true" className="size-4" />
            {dictionary.actions.downloadPortfolio}
          </a>
        ) : null}

        {season.awards.length > 0 ? (
          <section className="space-y-4">
            <h2 className="text-2xl font-bold">{dictionary.meta.awards}</h2>
            <ul className="grid gap-4 sm:grid-cols-2">
              {season.awards.map((award, idx) => {
                const name = getLocalized(bilingual(award, 'name'), locale)
                const notes = getLocalized(bilingual(award, 'notes'), locale)

                return (
                  <li
                    key={award.id}
                    className="zine-card-paper masking-tape-gold relative rounded-2xl p-5"
                    style={{
                      transform: `rotate(${idx % 2 === 0 ? -1.1 : 1.2}deg)`,
                    }}
                  >
                    <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                      <h3 className="font-display text-lg font-bold">
                        {name?.value}
                      </h3>
                      {award.placement ? (
                        <span className="bg-branch-accent text-branch-accent-contrast rounded-md px-2 py-0.5 font-mono text-2xs font-bold uppercase">
                          {award.placement}
                        </span>
                      ) : null}
                    </div>
                    <p className="text-branch-muted mt-1 text-sm">
                      {award.eventName} ·{' '}
                      <time dateTime={toIsoDate(award.eventDate)}>
                        {formatDate(award.eventDate, locale)}
                      </time>
                    </p>
                    {notes ? (
                      <p className="font-hand text-ink mt-2 text-lg">
                        {notes.value}
                      </p>
                    ) : null}
                  </li>
                )
              })}
            </ul>
          </section>
        ) : null}

        {season.gallery.length > 0 ? (
          <section className="space-y-3">
            <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {season.gallery.map((image, idx) => (
                <li
                  key={image.url}
                  style={{
                    transform: `rotate(${((idx % 3) - 1) * 1.4}deg)`,
                  }}
                >
                  <img
                    src={image.url}
                    alt={getLocalized(image.alt, locale)?.value ?? ''}
                    width={image.width}
                    height={image.height}
                    loading="lazy"
                    decoding="async"
                    className={cn(
                      'zine-card-paper aspect-[4/3] w-full rounded-xl',
                      imageFitClass(image),
                    )}
                  />
                </li>
              ))}
            </ul>
          </section>
        ) : null}
      </div>
    </BranchTheme>
  )
}

function SeasonNotFound() {
  const locale = useLocale()
  const dictionary = useDictionary()
  return (
    <BranchTheme branch="non_tech" as="main" className="min-h-screen">
      <div className="mx-auto w-full max-w-measure space-y-4 px-4 py-16 sm:px-6">
        <OntonSticker pose="huh" locale={locale} size="lg" rotate={-5} />
        <h1 className="text-2xl font-bold">
          {dictionary.errors.notFoundTitle}
        </h1>
        <p className="text-branch-muted">{dictionary.errors.notFoundBody}</p>
        <Link to="/$locale/seasons" params={{ locale }} className="text-sm">
          {dictionary.nav.seasons}
        </Link>
      </div>
    </BranchTheme>
  )
}

function SeasonError() {
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
