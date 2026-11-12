import { ArrowRight } from 'lucide-react'
import { Link, createFileRoute } from '@tanstack/react-router'

import { BranchTheme } from '@/components/branch-theme'
import { OntonSticker } from '@/components/onton'
import { getDictionary } from '@/i18n/dictionaries'
import { bilingual, getLocalized } from '@/i18n/localized'
import { DEFAULT_LOCALE, isLocale } from '@/i18n/locale'
import { useDictionary, useLocale } from '@/i18n/use-locale'
import { BRANCH_SLUGS } from '@/lib/branch'
import { buildPageMeta } from '@/lib/site'
import { tornSeamPolygon } from '@/lib/torn-edge'
import { getPerformanceEntries } from '@/server/performance'

/**
 * The performance overview — CLAUDE.md §4.
 *
 * NOTE: §7.3 specifies different STRUCTURES per branch. The team asked for one
 * structure with only the palette changing, so both halves are now identical
 * in layout and differ only in ground, text and accent. §7.3 is out of date
 * with the site on that point; the torn seam between the halves remains.
 */
export const Route = createFileRoute('/$locale/performance/')({
  loader: () => getPerformanceEntries({ data: { limit: 6 } }),
  head: ({ params }) => {
    const locale = isLocale(params.locale) ? params.locale : DEFAULT_LOCALE
    const dictionary = getDictionary(locale)
    const title = `${dictionary.nav.performance} — ${dictionary.site.name} (${dictionary.site.teamNumber})`
    const description =
      locale === 'ro'
        ? `Realizări tehnice (${dictionary.nav.performanceTech}) și proiecte comunitare (${dictionary.nav.performanceNonTech}) ale echipei ${dictionary.site.name} (FTC #25474).`
        : `Technical achievements (${dictionary.nav.performanceTech}) and community outreach (${dictionary.nav.performanceNonTech}) by ${dictionary.site.name} (FTC #25474).`

    return {
      meta: buildPageMeta({
        title,
        description,
        locale,
        pathname: `/${locale}/performance`,
      }),
    }
  },
  component: PerformanceOverview,
  errorComponent: PerformanceError,
})

const SEAM_HORIZONTAL = tornSeamPolygon({
  seed: 'performance-seam',
  direction: 'horizontal',
  amplitude: 3.4,
  inset: 4.5,
})

const SEAM_VERTICAL = tornSeamPolygon({
  seed: 'performance-seam',
  direction: 'vertical',
  amplitude: 3.1,
  inset: 4.5,
})

function PerformanceOverview() {
  const entries = Route.useLoaderData()
  const locale = useLocale()
  const dictionary = useDictionary()

  const tech = entries.filter((entry) => entry.branch === 'tech')
  const nonTech = entries.filter((entry) => entry.branch === 'non_tech')

  return (
    <main className="flex flex-1 flex-col">
      <div
        className="relative isolate flex flex-1 flex-col"
        style={
          {
            '--seam': SEAM_HORIZONTAL,
            '--seam-wide': SEAM_VERTICAL,
          } as React.CSSProperties
        }
      >
        <div className="grid flex-1 lg:grid-cols-2">
          {/* ── Tech half ─────────────────────────────────────────────── */}
          <BranchTheme branch="tech" className="relative flex items-center">
            <div className="relative mx-auto w-full max-w-xl space-y-5 px-4 py-12 sm:px-6 lg:ml-auto lg:mr-0 lg:py-20 lg:pr-16">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <p className="branch-label text-branch-accent-text">
                    {dictionary.nav.performance}
                  </p>
                  <h1 className="text-3xl font-bold sm:text-4xl">
                    {dictionary.nav.performanceTech}
                  </h1>
                </div>
                <OntonSticker
                  pose="demolisher"
                  locale={locale}
                  size="md"
                  rotate={-6}
                  floating
                />
              </div>

              {tech.length > 0 ? (
                <ul className="space-y-3">
                  {tech.slice(0, 3).map((entry, idx) => {
                    const title = getLocalized(bilingual(entry, 'title'), locale)
                    const summary = getLocalized(
                      bilingual(entry, 'summary'),
                      locale,
                    )
                    return (
                      <li
                        key={entry.slug}
                        className="zine-card rounded-xl p-3.5"
                        style={{
                          transform: `rotate(${idx % 2 === 0 ? -0.8 : 0.9}deg)`,
                        }}
                      >
                        <Link
                          to="/$locale/performance/$branch/$slug"
                          params={{
                            locale,
                            branch: BRANCH_SLUGS.tech,
                            slug: entry.slug,
                          }}
                          className="block no-underline"
                        >
                          <p className="font-display font-bold">
                            {title?.value}
                          </p>
                          {summary ? (
                            <p className="text-branch-muted mt-1 text-sm">
                              {summary.value}
                            </p>
                          ) : null}
                        </Link>
                      </li>
                    )
                  })}
                </ul>
              ) : null}

              <div className="flex flex-wrap items-center gap-4 pt-2">
                <Link
                  to="/$locale/performance/$branch"
                  params={{ locale, branch: BRANCH_SLUGS.tech }}
                  className="zine-btn bg-branch-accent text-branch-accent-contrast inline-flex items-center gap-1.5 rounded-xl px-4 py-2.5 text-sm font-bold no-underline -rotate-1"
                >
                  {dictionary.actions.viewAll}
                  <ArrowRight aria-hidden="true" className="size-4" />
                </Link>
              </div>
            </div>
          </BranchTheme>

          {/* ── Non-tech half, torn over the tech half ────────────────── */}
          <BranchTheme
            branch="non_tech"
            className={[
              'relative',
              '[clip-path:var(--seam)] lg:[clip-path:var(--seam-wide)]',
              '-mt-8 lg:-ml-10 lg:mt-0',
            ].join(' ')}
          >
            <div className="mx-auto w-full max-w-xl space-y-5 px-4 pt-16 pb-12 sm:px-6 lg:mr-auto lg:ml-0 lg:py-20 lg:pl-20">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <p className="branch-label text-branch-muted">
                    {dictionary.nav.performance}
                  </p>
                  <h2 className="text-3xl font-bold sm:text-4xl">
                    {dictionary.nav.performanceNonTech}
                  </h2>
                </div>
                <OntonSticker
                  pose="french"
                  locale={locale}
                  size="md"
                  rotate={7}
                  floating
                />
              </div>

              {nonTech.length > 0 ? (
                <ul className="space-y-3">
                  {nonTech.slice(0, 3).map((entry, idx) => {
                    const title = getLocalized(bilingual(entry, 'title'), locale)
                    const summary = getLocalized(
                      bilingual(entry, 'summary'),
                      locale,
                    )
                    return (
                      <li
                        key={entry.slug}
                        className="zine-card-paper rounded-xl p-3.5"
                        style={{
                          transform: `rotate(${idx % 2 === 0 ? 0.9 : -0.8}deg)`,
                        }}
                      >
                        <Link
                          to="/$locale/performance/$branch/$slug"
                          params={{
                            locale,
                            branch: BRANCH_SLUGS.non_tech,
                            slug: entry.slug,
                          }}
                          className="block no-underline"
                        >
                          <p className="font-display font-bold">
                            {title?.value}
                          </p>
                          {summary ? (
                            <p className="text-branch-muted mt-1 text-sm">
                              {summary.value}
                            </p>
                          ) : null}
                        </Link>
                      </li>
                    )
                  })}
                </ul>
              ) : null}

              <div className="flex flex-wrap items-center gap-4 pt-2">
                <Link
                  to="/$locale/performance/$branch"
                  params={{ locale, branch: BRANCH_SLUGS.non_tech }}
                  className="zine-btn bg-branch-accent text-branch-accent-contrast inline-flex items-center gap-1.5 rounded-xl px-4 py-2.5 text-sm font-bold no-underline rotate-1"
                >
                  {dictionary.actions.viewAll}
                  <ArrowRight aria-hidden="true" className="size-4" />
                </Link>
              </div>
            </div>
          </BranchTheme>
        </div>
      </div>

      {entries.length === 0 ? (
        <BranchTheme branch="non_tech">
          <div className="mx-auto max-w-measure px-4 py-10 sm:px-6">
            <p className="text-branch-muted">{dictionary.empty.performance}</p>
          </div>
        </BranchTheme>
      ) : null}
    </main>
  )
}

function PerformanceError() {
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
