import { Link, createFileRoute } from '@tanstack/react-router'

import { BranchTheme } from '@/components/branch-theme'
import { getDictionary } from '@/i18n/dictionaries'
import { formatDate, toIsoDate } from '@/i18n/format'
import { bilingual, getLocalized } from '@/i18n/localized'
import { DEFAULT_LOCALE, isLocale } from '@/i18n/locale'
import { useDictionary, useLocale } from '@/i18n/use-locale'
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
    return {
      meta: [
        { title: `${dictionary.nav.news} — ${dictionary.site.name}` },
        { name: 'description', content: dictionary.site.tagline },
      ],
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
        <header className="space-y-2">
          <h1 className="text-3xl font-semibold">{dictionary.nav.news}</h1>
        </header>

        {posts.length === 0 ? (
          <div className="border-branch-border max-w-measure rounded-md border border-dashed p-6">
            <p className="text-branch-muted">{dictionary.empty.news}</p>
          </div>
        ) : (
          <ul className="grid gap-6 sm:grid-cols-2">
            {posts.map((post, index) => {
              const title = getLocalized(bilingual(post, 'title'), locale)
              const excerpt = getLocalized(bilingual(post, 'excerpt'), locale)

              return (
                <li key={post.slug}>
                  <Link
                    to="/$locale/news/$slug"
                    params={{ locale, slug: post.slug }}
                    className="group block no-underline"
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
                        className="aspect-[3/2] w-full rounded-md object-cover"
                      />
                    ) : (
                      <div className="bg-branch-surface aspect-[3/2] w-full rounded-md" />
                    )}

                    <div className="mt-3 space-y-1">
                      {post.publishedAt ? (
                        <time
                          dateTime={toIsoDate(post.publishedAt)}
                          className="branch-label text-branch-muted"
                        >
                          {formatDate(post.publishedAt, locale)}
                        </time>
                      ) : null}
                      <h2 className="text-xl font-semibold group-hover:underline">
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
