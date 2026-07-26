import { ArrowLeft, FileText } from 'lucide-react'
import { Link, createFileRoute, notFound } from '@tanstack/react-router'

import { BranchTheme } from '@/components/branch-theme'
import { FallbackNote } from '@/components/localized-text'
import { getDictionary } from '@/i18n/dictionaries'
import { formatDate, formatMonthYear, toIsoDate } from '@/i18n/format'
import { bilingual, getLocalized } from '@/i18n/localized'
import { DEFAULT_LOCALE, isLocale } from '@/i18n/locale'
import { useDictionary, useLocale } from '@/i18n/use-locale'
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
    if (!loaderData) return { meta: [{ title: dictionary.nav.seasons }] }

    const title = `${loaderData.name} — ${loaderData.gameName}`
    return {
      meta: [
        { title: `${title} — ${dictionary.site.name}` },
        { property: 'og:title', content: title },
        ...(loaderData.coverImage
          ? [{ property: 'og:image', content: loaderData.coverImage.url }]
          : []),
      ],
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

        <header className="space-y-2">
          <p className="branch-label text-branch-muted">
            {formatMonthYear(season.startDate, locale)}
            {season.endDate
              ? ` — ${formatMonthYear(season.endDate, locale)}`
              : ''}
          </p>
          <h1 className="text-3xl font-semibold">{season.name}</h1>
          <p className="text-branch-muted text-lg">{season.gameName}</p>
        </header>

        {season.coverImage ? (
          <img
            src={season.coverImage.url}
            alt={getLocalized(season.coverImage.alt, locale)?.value ?? ''}
            width={season.coverImage.width}
            height={season.coverImage.height}
            fetchPriority="high"
            decoding="async"
            className="w-full rounded-md"
          />
        ) : null}

        <div>
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
            className="bg-branch-accent text-branch-accent-contrast inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-semibold no-underline"
          >
            <FileText aria-hidden="true" className="size-4" />
            {dictionary.actions.downloadPortfolio}
          </a>
        ) : null}

        {season.awards.length > 0 ? (
          <section className="space-y-3">
            <h2 className="text-2xl font-semibold">{dictionary.meta.awards}</h2>
            <ul className="space-y-2">
              {season.awards.map((award) => {
                const name = getLocalized(bilingual(award, 'name'), locale)
                const notes = getLocalized(bilingual(award, 'notes'), locale)

                return (
                  <li
                    key={award.id}
                    className="border-branch-border rounded-md border p-4"
                  >
                    <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                      <h3 className="font-semibold">{name?.value}</h3>
                      {award.placement ? (
                        <span className="bg-branch-accent text-branch-accent-contrast rounded px-1.5 py-0.5 font-mono text-2xs font-semibold uppercase">
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
                      <p className="text-branch-muted mt-2 text-sm">
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
            <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {season.gallery.map((image) => (
                <li key={image.url}>
                  <img
                    src={image.url}
                    alt={getLocalized(image.alt, locale)?.value ?? ''}
                    width={image.width}
                    height={image.height}
                    loading="lazy"
                    decoding="async"
                    className="w-full rounded-md"
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
        <h1 className="text-2xl font-semibold">
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
