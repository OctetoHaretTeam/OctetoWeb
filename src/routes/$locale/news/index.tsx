import { Link, createFileRoute } from '@tanstack/react-router'

import { BranchTheme } from '@/components/branch-theme'
import {
  ONTON_POSES,
  OntonSticker,
  ontonPoseForSeed,
} from '@/components/onton'
import { getDictionary } from '@/i18n/dictionaries'
import { formatDate, toIsoDate } from '@/i18n/format'
import { bilingual, getLocalized } from '@/i18n/localized'
import { DEFAULT_LOCALE, isLocale } from '@/i18n/locale'
import { useDictionary, useLocale } from '@/i18n/use-locale'
import { imageFitClass } from '@/lib/schemas'
import { buildPageMeta } from '@/lib/site'
import { cn } from '@/lib/utils'
import { getPublishedNews } from '@/server/news'

/**
 * News index — CLAUDE.md §4.
 *
 * Non-tech treatment: news is photo-led and belongs to the paper layer (§7.1).
 * Only published posts reach here; the query filters drafts (§5).
 */
export const Route = createFileRoute('/$locale/news/')({
  loader: () => getPublishedNews({ data: {} }),
  head: ({ params }) => {
    const locale = isLocale(params.locale) ? params.locale : DEFAULT_LOCALE
    const dictionary = getDictionary(locale)
    const title = `${dictionary.nav.news} — ${dictionary.site.name} (${dictionary.site.teamNumber})`
    const description =
      locale === 'ro'
        ? `Noutăți și articole de la echipa de robotică ${dictionary.site.name} (Octeto / FTC #25474) din Chișinău.`
        : `Latest news and articles from ${dictionary.site.name} (Octeto / FTC #25474) robotics team in Chișinău, Moldova.`

    return {
      meta: buildPageMeta({
        title,
        description,
        locale,
        pathname: `/${locale}/news`,
      }),
    }
  },
  component: NewsIndex,
  pendingComponent: NewsPending,
  errorComponent: NewsError,
})

function NewsIndex() {
  const posts = Route.useLoaderData()
  const locale = useLocale()
  const dictionary = useDictionary()

  return (
    <BranchTheme branch="non_tech" as="main" className="min-h-screen">
      <div className="mx-auto w-full max-w-5xl space-y-8 px-4 py-10 sm:px-6">
        <header className="flex flex-wrap items-center justify-between gap-6">
          <h1 className="text-3xl font-bold sm:text-4xl">
            {dictionary.nav.news}
          </h1>
          <OntonSticker
            pose="cofe"
            locale={locale}
            size="lg"
            rotate={-6}
            floating
          />
        </header>

        {posts.length === 0 ? (
          <div className="zine-card-paper masking-tape relative flex flex-wrap items-center gap-6 rounded-2xl p-6 -rotate-1">
            <OntonSticker pose="huh" locale={locale} size="md" rotate={5} />
            <p className="text-branch-muted">{dictionary.empty.news}</p>
          </div>
        ) : (
          <ul className="grid gap-8 sm:grid-cols-2">
            {posts.map((post, index) => {
              const title = getLocalized(bilingual(post, 'title'), locale)
              const excerpt = getLocalized(bilingual(post, 'excerpt'), locale)
              const fallbackPose = ontonPoseForSeed(post.slug)
              const fallbackSpec = ONTON_POSES[fallbackPose]
              const tilt = index % 2 === 0 ? -1.3 : 1.3

              return (
                <li
                  key={post.slug}
                  style={{ transform: `rotate(${tilt}deg)` }}
                  className="transition-transform duration-200 hover:rotate-0"
                >
                  <Link
                    to="/$locale/news/$slug"
                    params={{ locale, slug: post.slug }}
                    className="zine-card-paper masking-tape group block rounded-2xl p-4 no-underline"
                  >
                    {post.coverImage ? (
                      <img
                        src={post.coverImage.url}
                        alt={
                          getLocalized(post.coverImage.alt, locale)?.value ?? ''
                        }
                        width={post.coverImage.width}
                        height={post.coverImage.height}
                        loading={index === 0 ? 'eager' : 'lazy'}
                        fetchPriority={index === 0 ? 'high' : 'auto'}
                        decoding="async"
                        className={cn(
                          'aspect-[3/2] w-full rounded-xl',
                          imageFitClass(post.coverImage),
                        )}
                      />
                    ) : (
                      <div className="bg-sage/40 border-branch-border flex aspect-[3/2] w-full items-center justify-center rounded-xl border-2 border-dashed p-6">
                        <img
                          src={fallbackSpec.src}
                          alt=""
                          aria-hidden="true"
                          width={fallbackSpec.width}
                          height={fallbackSpec.height}
                          loading="lazy"
                          decoding="async"
                          className="onton-sticker-shadow h-32 w-32 object-contain"
                        />
                      </div>
                    )}

                    <div className="mt-3 space-y-1 px-1">
                      {post.publishedAt ? (
                        <time
                          dateTime={toIsoDate(post.publishedAt)}
                          className="branch-label text-branch-muted"
                        >
                          {formatDate(post.publishedAt, locale)}
                        </time>
                      ) : null}
                      <h2 className="text-xl font-bold group-hover:underline">
                        {title?.value}
                      </h2>
                      {excerpt ? (
                        <p className="text-branch-muted text-sm">
                          {excerpt.value}
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

function NewsPending() {
  return (
    <BranchTheme branch="non_tech" as="main" className="min-h-screen">
      <div className="mx-auto w-full max-w-5xl space-y-8 px-4 py-10 sm:px-6">
        <div className="bg-branch-surface/40 h-9 w-40 rounded" />
        <ul className="grid gap-6 sm:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <li key={i} className="space-y-3">
              <div className="bg-branch-surface/40 aspect-[3/2] w-full rounded-md" />
              <div className="bg-branch-surface/40 h-5 w-3/4 rounded" />
            </li>
          ))}
        </ul>
      </div>
    </BranchTheme>
  )
}

function NewsError() {
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
