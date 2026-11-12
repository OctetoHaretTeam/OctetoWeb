import { ArrowLeft } from 'lucide-react'
import { Link, createFileRoute, notFound } from '@tanstack/react-router'

import { BranchTheme } from '@/components/branch-theme'
import { FallbackNote } from '@/components/localized-text'
import { OntonSticker, ontonPoseForSeed } from '@/components/onton'
import { getDictionary } from '@/i18n/dictionaries'
import { formatDate, toIsoDate } from '@/i18n/format'
import { bilingual, getLocalized } from '@/i18n/localized'
import { DEFAULT_LOCALE, isLocale } from '@/i18n/locale'
import { useDictionary, useLocale } from '@/i18n/use-locale'
import { imageFitClass } from '@/lib/schemas'
import { buildPageMeta } from '@/lib/site'
import { cn } from '@/lib/utils'
import { getNewsPost } from '@/server/news'

/**
 * A news article — CLAUDE.md §4.
 *
 * The body arrives as HTML already rendered on the server, so markdown-it
 * never reaches the browser (§12). Raw HTML is disabled in the renderer, which
 * is what makes `dangerouslySetInnerHTML` safe here: the source cannot contain
 * markup, only escaped text.
 */
export const Route = createFileRoute('/$locale/news/$slug')({
  loader: async ({ params }) => {
    const post = await getNewsPost({ data: { slug: params.slug } })
    if (!post) throw notFound()
    return post
  },

  head: ({ params, loaderData }) => {
    const locale = isLocale(params.locale) ? params.locale : DEFAULT_LOCALE
    const dictionary = getDictionary(locale)
    if (!loaderData) {
      return {
        meta: buildPageMeta({
          title: `${dictionary.nav.news} — ${dictionary.site.name}`,
          description: dictionary.site.tagline,
          locale,
          pathname: `/${locale}/news/${params.slug}`,
        }),
      }
    }

    const title = getLocalized(bilingual(loaderData, 'title'), locale)
    const excerpt = getLocalized(bilingual(loaderData, 'excerpt'), locale)
    const heading = title?.value ?? dictionary.nav.news

    return {
      meta: buildPageMeta({
        title: `${heading} — ${dictionary.site.name} (${dictionary.site.teamNumber})`,
        description: excerpt?.value ?? dictionary.site.tagline,
        locale,
        pathname: `/${locale}/news/${loaderData.slug}`,
        image: loaderData.coverImage?.url,
        imageAlt: heading,
        type: 'article',
      }),
    }
  },

  component: Article,
  pendingComponent: ArticlePending,
  notFoundComponent: ArticleNotFound,
  errorComponent: ArticleError,
})

function Article() {
  const post = Route.useLoaderData()
  const locale = useLocale()
  const dictionary = useDictionary()

  const title = getLocalized(bilingual(post, 'title'), locale)
  const body = post.bodyHtml[locale] ?? post.bodyHtml.ro
  const isFallback = post.bodyHtml[locale] === null
  const pose = ontonPoseForSeed(post.slug)

  return (
    <BranchTheme branch="non_tech" as="main" className="min-h-screen">
      <div className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6">
        <Link
          to="/$locale/news"
          params={{ locale }}
          className="text-branch-muted hover:text-branch-text inline-flex items-center gap-1.5 text-sm no-underline"
        >
          <ArrowLeft aria-hidden="true" className="size-4" />
          {dictionary.nav.news}
        </Link>

        <article className="mt-6 space-y-6">
          <header className="flex flex-wrap items-start justify-between gap-4">
            <div className="space-y-2">
              {post.publishedAt ? (
                <time
                  dateTime={toIsoDate(post.publishedAt)}
                  className="branch-label text-branch-muted"
                >
                  {formatDate(post.publishedAt, locale)}
                </time>
              ) : null}

              <h1 className="text-3xl font-bold sm:text-4xl">{title?.value}</h1>

              {post.author ? (
                <p className="text-branch-muted text-sm">{post.author.name}</p>
              ) : null}
            </div>
            <OntonSticker
              pose={pose}
              locale={locale}
              size="md"
              rotate={6}
              floating
            />
          </header>

          {post.coverImage ? (
            <img
              src={post.coverImage.url}
              alt={getLocalized(post.coverImage.alt, locale)?.value ?? ''}
              width={post.coverImage.width}
              height={post.coverImage.height}
              fetchPriority="high"
              decoding="async"
              className={cn(
                'zine-card-paper aspect-[3/2] w-full rounded-2xl',
                imageFitClass(post.coverImage),
              )}
            />
          ) : null}

          <div className="zine-card-paper relative rounded-2xl p-6 sm:p-8 -rotate-0.5">
            <span
              aria-hidden="true"
              className="masking-tape pointer-events-none absolute -top-2.5 left-12 z-10 h-5 w-24 -rotate-2"
            />
            <div
              className="prose-body max-w-measure space-y-4"
              lang={isFallback ? 'ro' : undefined}
              dangerouslySetInnerHTML={{ __html: body }}
            />
            {isFallback ? <FallbackNote locale={locale} /> : null}
          </div>

          {post.gallery.length > 0 ? (
            <ul className="grid gap-4 sm:grid-cols-2">
              {post.gallery.map((image, idx) => (
                <li
                  key={image.url}
                  style={{
                    transform: `rotate(${idx % 2 === 0 ? -1.4 : 1.4}deg)`,
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
          ) : null}
        </article>
      </div>
    </BranchTheme>
  )
}

function ArticlePending() {
  return (
    <BranchTheme branch="non_tech" as="main" className="min-h-screen">
      <div className="mx-auto w-full max-w-3xl space-y-4 px-4 py-8 sm:px-6">
        <div className="bg-branch-surface/40 h-4 w-24 rounded" />
        <div className="bg-branch-surface/40 h-9 w-3/4 rounded" />
        <div className="bg-branch-surface/40 aspect-[3/2] w-full rounded-md" />
      </div>
    </BranchTheme>
  )
}

function ArticleNotFound() {
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
        <Link to="/$locale/news" params={{ locale }} className="text-sm">
          {dictionary.nav.news}
        </Link>
      </div>
    </BranchTheme>
  )
}

function ArticleError() {
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
