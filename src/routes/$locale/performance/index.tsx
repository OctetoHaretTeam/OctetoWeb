import { ArrowRight } from 'lucide-react'
import { Link, createFileRoute } from '@tanstack/react-router'

import { BranchTheme } from '@/components/branch-theme'
import { getDictionary } from '@/i18n/dictionaries'
import { bilingual, getLocalized } from '@/i18n/localized'
import { DEFAULT_LOCALE, isLocale } from '@/i18n/locale'
import { useDictionary, useLocale } from '@/i18n/use-locale'
import { BRANCH_SLUGS } from '@/lib/branch'
import { tornSeamPolygon } from '@/lib/torn-edge'
import { getPerformanceEntries } from '@/server/performance'

/**
 * The performance overview — CLAUDE.md §4.
 *
 * NOTE: §7.3 specifies different STRUCTURES per branch. The team asked for one
 * structure with only the palette changing, so both halves are now identical
 * in layout and differ only in ground, text and accent. §7.3 is out of date
 * with the site on that point; the torn seam between the halves remains.
 *
 * The two branches meet along a torn edge, with the non-tech paper tearing
 * over the tech half.
 *
 * **The seam turns with the layout.** Side by side it runs vertically; stacked
 * it runs horizontally, which is the direction a sheet of paper would actually
 * tear across a narrow column. Both polygons are generated from the same seed
 * and swapped by a media query, so the browser never has to run any of this.
 *
 * The mobile answer to "won't it just be two things stacked": the tech panel
 * is deliberately short — its content ends well inside the first viewport —
 * so the tear itself is visible without scrolling. The split reads as one
 * composition rather than two separate pages.
 *
 * This shares the tear MATHS with `PaperCutout`, not the component: §7.4 keeps
 * the torn halo exclusive to people.
 */
export const Route = createFileRoute('/$locale/performance/')({
  loader: () => getPerformanceEntries({ data: { limit: 6 } }),
  head: ({ params }) => {
    const locale = isLocale(params.locale) ? params.locale : DEFAULT_LOCALE
    const dictionary = getDictionary(locale)
    return {
      meta: [
        { title: `${dictionary.nav.performance} — ${dictionary.site.name}` },
      ],
    }
  },
  component: PerformanceOverview,
  errorComponent: PerformanceError,
})

const SEAM_HORIZONTAL = tornSeamPolygon({
  seed: 'performance-seam',
  direction: 'horizontal',
  amplitude: 2.2,
  inset: 4,
})

const SEAM_VERTICAL = tornSeamPolygon({
  seed: 'performance-seam',
  direction: 'vertical',
  amplitude: 1.8,
  inset: 4,
})

function PerformanceOverview() {
  const entries = Route.useLoaderData()
  const locale = useLocale()
  const dictionary = useDictionary()

  const tech = entries.filter((entry) => entry.branch === 'tech')
  const nonTech = entries.filter((entry) => entry.branch === 'non_tech')

  /*
   * The split fills the viewport itself (`min-h-screen`), matching every
   * other page's outer section. Without it the hero was only as tall as its
   * three lines of text, and the site-wide footer now sits right under every
   * page — a short torn hero with a flat, undecorated void between it and the
   * footer read as broken rather than as breathing room.
   */
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
            <div className="relative mx-auto w-full max-w-xl space-y-4 px-4 py-12 sm:px-6 lg:ml-auto lg:mr-0 lg:py-20 lg:pr-16">
              <p className="branch-label text-branch-accent-text">
                {dictionary.nav.performance}
              </p>
              <h1 className="text-3xl font-semibold">
                {dictionary.nav.performanceTech}
              </h1>

              <ul className="space-y-3">
                {tech.slice(0, 3).map((entry) => {
                  const title = getLocalized(bilingual(entry, 'title'), locale)
                  const summary = getLocalized(bilingual(entry, 'summary'), locale)
                  return (
                    <li key={entry.slug}>
                      <p className="font-semibold">{title?.value}</p>
                      {summary ? (
                        <p className="text-branch-muted text-sm">
                          {summary.value}
                        </p>
                      ) : null}
                    </li>
                  )
                })}
              </ul>

              <Link
                to="/$locale/performance/$branch"
                params={{ locale, branch: BRANCH_SLUGS.tech }}
                className="bg-branch-accent text-branch-accent-contrast inline-flex items-center gap-1.5 rounded-md px-4 py-2 text-sm font-semibold no-underline"
              >
                {dictionary.actions.viewAll}
                <ArrowRight aria-hidden="true" className="size-4" />
              </Link>
            </div>
          </BranchTheme>

          {/* ── Non-tech half, torn over the tech half ────────────────── */}
          <BranchTheme
            branch="non_tech"
            className={[
              'relative',
              // The tear. Horizontal when stacked, vertical side by side.
              '[clip-path:var(--seam)] lg:[clip-path:var(--seam-wide)]',
              // Pulled back so the torn edge overlaps the tech half rather
              // than leaving a gap where the sheet lifts.
              '-mt-8 lg:-ml-10 lg:mt-0',
            ].join(' ')}
          >
            <div className="mx-auto w-full max-w-xl space-y-4 px-4 pt-16 pb-12 sm:px-6 lg:mr-auto lg:ml-0 lg:py-20 lg:pl-20">
              <p className="branch-label text-branch-muted">
                {dictionary.nav.performance}
              </p>
              <h2 className="text-3xl font-semibold">
                {dictionary.nav.performanceNonTech}
              </h2>

              <ul className="space-y-3">
                {nonTech.slice(0, 3).map((entry) => {
                  const title = getLocalized(bilingual(entry, 'title'), locale)
                  const summary = getLocalized(
                    bilingual(entry, 'summary'),
                    locale,
                  )
                  return (
                    <li key={entry.slug}>
                      <p className="font-semibold">{title?.value}</p>
                      {summary ? (
                        <p className="text-branch-muted text-sm">
                          {summary.value}
                        </p>
                      ) : null}
                    </li>
                  )
                })}
              </ul>

              <Link
                to="/$locale/performance/$branch"
                params={{ locale, branch: BRANCH_SLUGS.non_tech }}
                className="bg-branch-accent text-branch-accent-contrast inline-flex items-center gap-1.5 rounded-md px-4 py-2 text-sm font-semibold no-underline"
              >
                {dictionary.actions.viewAll}
                <ArrowRight aria-hidden="true" className="size-4" />
              </Link>
            </div>
          </BranchTheme>
        </div>
      </div>

      {entries.length === 0 ? (
        <BranchTheme branch="non_tech" className="border-branch-border border-t">
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
