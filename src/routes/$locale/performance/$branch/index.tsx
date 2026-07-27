import { Link, createFileRoute, notFound } from '@tanstack/react-router'

import { BranchTheme } from '@/components/branch-theme'
import { PaperCutout } from '@/components/paper-cutout'
import { getDictionary } from '@/i18n/dictionaries'
import { bilingual, getLocalized } from '@/i18n/localized'
import { DEFAULT_LOCALE, isLocale } from '@/i18n/locale'
import { useDictionary, useLocale } from '@/i18n/use-locale'
import { BRANCH_SLUGS, branchFromSlug } from '@/lib/branch'
import { getPerformanceEntries } from '@/server/performance'

/**
 * A branch index — CLAUDE.md §4.
 *
 * NOTE: §7.3 specifies different STRUCTURES per branch — a spec table on a
 * hairline grid for tech, a photo-led collage for non-tech. The team asked for
 * one structure with only the palette changing, having seen both, so this
 * deliberately departs from that table. §7.3 is now out of date with the site.
 *
 * The collage is the surviving design, which means `PaperCutout` covers now
 * appear on technical entries too — a wider use than the three places §7.4
 * names.
 */
export const Route = createFileRoute('/$locale/performance/$branch/')({
  loader: async ({ params }) => {
    const branch = branchFromSlug(params.branch)
    if (!branch) throw notFound()

    const entries = await getPerformanceEntries({ data: { branch } })
    return { branch, entries }
  },
  head: ({ params }) => {
    const locale = isLocale(params.locale) ? params.locale : DEFAULT_LOCALE
    const dictionary = getDictionary(locale)
    const branch = branchFromSlug(params.branch)
    const label =
      branch === 'tech'
        ? dictionary.nav.performanceTech
        : dictionary.nav.performanceNonTech

    return {
      meta: [{ title: `${label} — ${dictionary.site.name}` }],
    }
  },
  component: BranchIndex,
  notFoundComponent: BranchNotFound,
  errorComponent: BranchError,
})

function BranchIndex() {
  const { branch, entries } = Route.useLoaderData()
  const locale = useLocale()
  const dictionary = useDictionary()

  const label =
    branch === 'tech'
      ? dictionary.nav.performanceTech
      : dictionary.nav.performanceNonTech

  return (
    <BranchTheme branch={branch} as="main" className="relative min-h-screen">
      <div className="relative mx-auto w-full max-w-5xl space-y-8 px-4 py-10 sm:px-6">
        <header className="space-y-2">
          <Link
            to="/$locale/performance"
            params={{ locale }}
            className="branch-label text-branch-muted no-underline"
          >
            {dictionary.nav.performance}
          </Link>
          <h1 className="text-3xl font-semibold">{label}</h1>
        </header>

        {entries.length === 0 ? (
          <div className="border-branch-border max-w-measure rounded-md border border-dashed p-6">
            <p className="text-branch-muted">{dictionary.empty.performance}</p>
          </div>
        ) : (
          <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {entries.map((entry) => {
              const title = getLocalized(bilingual(entry, 'title'), locale)
              const summary = getLocalized(bilingual(entry, 'summary'), locale)

              return (
                <li key={entry.slug}>
                  <Link
                    to="/$locale/performance/$branch/$slug"
                    params={{
                      locale,
                      branch: BRANCH_SLUGS[branch],
                      slug: entry.slug,
                    }}
                    className="group block no-underline"
                  >
                    <PaperCutout
                      seed={entry.slug}
                      className="aspect-[4/3] w-full"
                    >
                      {entry.coverImage ? (
                        <img
                          src={entry.coverImage.url}
                          alt={
                            getLocalized(entry.coverImage.alt, locale)?.value ??
                            ''
                          }
                          width={entry.coverImage.width}
                          height={entry.coverImage.height}
                          loading="lazy"
                          decoding="async"
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="bg-branch-ground h-full w-full" />
                      )}
                    </PaperCutout>

                    <div className="mt-3 space-y-1">
                      <p className="branch-label text-branch-muted">
                        {entry.category}
                      </p>
                      <p className="font-semibold group-hover:underline">
                        {title?.value}
                      </p>
                      {summary ? (
                        <p className="text-branch-muted text-sm">
                          {summary.value}
                        </p>
                      ) : null}
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

function BranchNotFound() {
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

function BranchError() {
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
