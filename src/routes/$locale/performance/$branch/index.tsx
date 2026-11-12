import { Link, createFileRoute, notFound } from '@tanstack/react-router'

import { BranchTheme } from '@/components/branch-theme'
import {
  ONTON_POSES,
  OntonSticker,
  ontonPoseForSeed,
} from '@/components/onton'
import { PaperCutout } from '@/components/paper-cutout'
import { getDictionary } from '@/i18n/dictionaries'
import { bilingual, getLocalized } from '@/i18n/localized'
import { DEFAULT_LOCALE, isLocale } from '@/i18n/locale'
import { useDictionary, useLocale } from '@/i18n/use-locale'
import { BRANCH_SLUGS, branchFromSlug } from '@/lib/branch'
import { imageFitClass } from '@/lib/schemas'
import { buildPageMeta } from '@/lib/site'
import { cn } from '@/lib/utils'
import { getPerformanceEntries } from '@/server/performance'

/**
 * A branch index — CLAUDE.md §4.
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
    const title = `${label} — ${dictionary.site.name} (${dictionary.site.teamNumber})`
    const description = `${label} — ${dictionary.nav.performance}, ${dictionary.site.name} (FTC #25474).`

    return {
      meta: buildPageMeta({
        title,
        description,
        locale,
        pathname: `/${locale}/performance/${params.branch}`,
      }),
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
        <header className="flex flex-wrap items-center justify-between gap-6">
          <div className="space-y-2">
            <Link
              to="/$locale/performance"
              params={{ locale }}
              className="branch-label text-branch-muted no-underline"
            >
              ← {dictionary.nav.performance}
            </Link>
            <h1 className="text-3xl font-bold sm:text-4xl">{label}</h1>
          </div>
          <OntonSticker
            pose={branch === 'tech' ? 'demolisher' : 'muchacho'}
            locale={locale}
            size="lg"
            rotate={branch === 'tech' ? -6 : 6}
            floating
          />
        </header>

        {entries.length === 0 ? (
          <div className="zine-card flex flex-wrap items-center gap-6 rounded-2xl p-6 -rotate-1">
            <OntonSticker
              pose={branch === 'tech' ? 'arson' : 'huh'}
              locale={locale}
              size="md"
              rotate={-4}
            />
            <p className="text-branch-muted">{dictionary.empty.performance}</p>
          </div>
        ) : (
          <ul className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {entries.map((entry, idx) => {
              const title = getLocalized(bilingual(entry, 'title'), locale)
              const summary = getLocalized(bilingual(entry, 'summary'), locale)
              const fallbackPose = ontonPoseForSeed(entry.slug)
              const fallbackSpec = ONTON_POSES[fallbackPose]
              const tilt = ((idx % 3) - 1) * 1.4

              return (
                <li
                  key={entry.slug}
                  style={{ transform: `rotate(${tilt}deg)` }}
                  className="transition-transform duration-200 hover:rotate-0"
                >
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
                          className={cn(
                            'h-full w-full',
                            imageFitClass(entry.coverImage),
                          )}
                        />
                      ) : (
                        <div className="bg-branch-ground flex h-full w-full items-center justify-center p-6">
                          <img
                            src={fallbackSpec.src}
                            alt=""
                            aria-hidden="true"
                            width={fallbackSpec.width}
                            height={fallbackSpec.height}
                            loading="lazy"
                            decoding="async"
                            className="onton-sticker-shadow max-h-full max-w-full object-contain"
                          />
                        </div>
                      )}
                    </PaperCutout>

                    <div className="zine-card mt-3 space-y-1 rounded-xl p-3.5">
                      <p className="branch-label text-branch-muted">
                        {entry.category}
                      </p>
                      <p className="font-display font-bold group-hover:underline">
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
        <OntonSticker pose="watahel" locale={locale} size="lg" rotate={-5} />
        <h1 className="text-2xl font-bold">
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
