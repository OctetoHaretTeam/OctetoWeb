import { ArrowLeft } from 'lucide-react'
import { Link, createFileRoute, notFound } from '@tanstack/react-router'

import { BranchTheme } from '@/components/branch-theme'
import { FallbackNote } from '@/components/localized-text'
import { getDictionary } from '@/i18n/dictionaries'
import { formatDate, formatNumber, toIsoDate } from '@/i18n/format'
import { bilingual, getLocalized } from '@/i18n/localized'
import { DEFAULT_LOCALE, isLocale } from '@/i18n/locale'
import { useDictionary, useLocale } from '@/i18n/use-locale'
import { BRANCH_SLUGS, branchFromSlug } from '@/lib/branch'
import { getPerformanceEntry } from '@/server/performance'

/**
 * A single performance entry — CLAUDE.md §4.
 *
 * Metrics are shown only when the entry carries them (§5 makes them optional)
 * and are never invented: an entry without numbers simply has no numbers.
 */
export const Route = createFileRoute('/$locale/performance/$branch/$slug')({
  loader: async ({ params }) => {
    const branch = branchFromSlug(params.branch)
    if (!branch) throw notFound()

    const entry = await getPerformanceEntry({
      data: { branch, slug: params.slug },
    })
    if (!entry) throw notFound()

    return entry
  },
  head: ({ params, loaderData }) => {
    const locale = isLocale(params.locale) ? params.locale : DEFAULT_LOCALE
    const dictionary = getDictionary(locale)
    if (!loaderData) return { meta: [{ title: dictionary.nav.performance }] }

    const title = getLocalized(bilingual(loaderData, 'title'), locale)
    const summary = getLocalized(bilingual(loaderData, 'summary'), locale)
    const heading = title?.value ?? dictionary.nav.performance

    return {
      meta: [
        { title: `${heading} — ${dictionary.site.name}` },
        { name: 'description', content: summary?.value ?? '' },
        { property: 'og:title', content: heading },
        ...(loaderData.coverImage
          ? [{ property: 'og:image', content: loaderData.coverImage.url }]
          : []),
      ],
    }
  },
  component: EntryDetail,
  notFoundComponent: EntryNotFound,
  errorComponent: EntryError,
})

function EntryDetail() {
  const entry = Route.useLoaderData()
  const locale = useLocale()
  const dictionary = useDictionary()

  const title = getLocalized(bilingual(entry, 'title'), locale)
  const body = entry.bodyHtml[locale] ?? entry.bodyHtml.ro
  const isFallback = entry.bodyHtml[locale] === null

  const metrics = entry.metrics
  const hasMetrics =
    metrics &&
    (metrics.peopleReached !== undefined ||
      metrics.schoolsVisited !== undefined ||
      metrics.fundsRaisedMdl !== undefined)

  return (
    <BranchTheme branch={entry.branch} as="main" className="min-h-screen">
      <div className="mx-auto w-full max-w-3xl space-y-6 px-4 py-8 sm:px-6">
        <Link
          to="/$locale/performance/$branch"
          params={{ locale, branch: BRANCH_SLUGS[entry.branch] }}
          className="text-branch-muted hover:text-branch-text inline-flex items-center gap-1.5 text-sm no-underline"
        >
          <ArrowLeft aria-hidden="true" className="size-4" />
          {entry.branch === 'tech'
            ? dictionary.nav.performanceTech
            : dictionary.nav.performanceNonTech}
        </Link>

        <header className="space-y-2">
          <p className="branch-label text-branch-muted">{entry.category}</p>
          <h1 className="text-3xl font-semibold">{title?.value}</h1>
          <p className="text-branch-muted text-sm">
            <time dateTime={toIsoDate(entry.date)}>
              {formatDate(entry.date, locale)}
            </time>
            {entry.seasonSlug ? (
              <>
                {' · '}
                <Link
                  to="/$locale/seasons/$slug"
                  params={{ locale, slug: entry.seasonSlug }}
                >
                  {entry.seasonName}
                </Link>
              </>
            ) : null}
          </p>
        </header>

        {entry.coverImage ? (
          <img
            src={entry.coverImage.url}
            alt={getLocalized(entry.coverImage.alt, locale)?.value ?? ''}
            width={entry.coverImage.width}
            height={entry.coverImage.height}
            fetchPriority="high"
            decoding="async"
            className="w-full rounded-md"
          />
        ) : null}

        {hasMetrics ? (
          <dl className="border-branch-border grid grid-cols-2 gap-4 rounded-md border p-4 sm:grid-cols-3">
            {metrics.peopleReached !== undefined ? (
              <Metric
                label={dictionary.meta.peopleReached}
                value={formatNumber(metrics.peopleReached, locale)}
              />
            ) : null}
            {metrics.schoolsVisited !== undefined ? (
              <Metric
                label={dictionary.meta.schoolsVisited}
                value={formatNumber(metrics.schoolsVisited, locale)}
              />
            ) : null}
            {metrics.fundsRaisedMdl !== undefined ? (
              <Metric
                label={dictionary.meta.fundsRaised}
                value={formatNumber(metrics.fundsRaisedMdl, locale)}
              />
            ) : null}
          </dl>
        ) : null}

        <div>
          <div
            className="prose-body max-w-measure"
            lang={isFallback ? 'ro' : undefined}
            dangerouslySetInnerHTML={{ __html: body }}
          />
          {isFallback ? <FallbackNote locale={locale} /> : null}
        </div>

        {entry.gallery.length > 0 ? (
          <ul className="grid gap-3 sm:grid-cols-2">
            {entry.gallery.map((image) => (
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
        ) : null}
      </div>
    </BranchTheme>
  )
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dd className="font-display text-2xl font-black">{value}</dd>
      <dt className="branch-label text-branch-muted">{label}</dt>
    </div>
  )
}

function EntryNotFound() {
  const locale = useLocale()
  const dictionary = useDictionary()
  return (
    <BranchTheme branch="non_tech" as="main" className="min-h-screen">
      <div className="mx-auto w-full max-w-measure space-y-4 px-4 py-16 sm:px-6">
        <h1 className="text-2xl font-semibold">
          {dictionary.errors.notFoundTitle}
        </h1>
        <p className="text-branch-muted">{dictionary.errors.notFoundBody}</p>
        <Link to="/$locale/performance" params={{ locale }} className="text-sm">
          {dictionary.nav.performance}
        </Link>
      </div>
    </BranchTheme>
  )
}

function EntryError() {
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
