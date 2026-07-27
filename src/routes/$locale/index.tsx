import { ArrowRight } from 'lucide-react'
import { Link, createFileRoute } from '@tanstack/react-router'

import { BranchTheme } from '@/components/branch-theme'
import { HeroMark } from '@/components/hero-mark'
import { TornSection } from '@/components/torn-section'
import { getDictionary } from '@/i18n/dictionaries'
import { formatCompact, formatDate, formatNumber, toIsoDate } from '@/i18n/format'
import { bilingual, getLocalized } from '@/i18n/localized'
import { DEFAULT_LOCALE, type Locale, isLocale } from '@/i18n/locale'
import { useDictionary, useLocale } from '@/i18n/use-locale'
import { getHomeData } from '@/server/home'

/**
 * Home — CLAUDE.md §4.
 *
 * Everything a sponsor or a stranger wants in one scroll: hero, award strip,
 * stats, latest news, sponsors, contact. The stats row comes from a cached
 * aggregate, never a per-request query (§12).
 *
 * The sections alternate between the two branch treatments, which is what
 * gives the page the team's split identity without a single duplicated
 * component (§7.3).
 */
export const Route = createFileRoute('/$locale/')({
  loader: () => getHomeData(),
  head: ({ params }) => {
    const locale = isLocale(params.locale) ? params.locale : DEFAULT_LOCALE
    const dictionary = getDictionary(locale)
    return {
      meta: [
        { title: `${dictionary.site.name} — ${dictionary.site.teamNumber}` },
        { name: 'description', content: dictionary.site.tagline },
      ],
    }
  },
  component: Home,
  errorComponent: HomeError,
})

function Home() {
  const { slides, awards, news, sponsors, stats } = Route.useLoaderData()
  const locale = useLocale()
  const dictionary = useDictionary()

  const hero = slides[0]
  const heroCaption = hero ? getLocalized(bilingual(hero, 'caption'), locale) : null

  return (
    <main>
      <TornSection
        branch="tech"
        seed="hero"
        torn={false}
        className="overflow-hidden"
      >
        {/* The watermark stands in for artwork. Once a real slide exists it
            would sit behind that image and fight it, so it steps aside. */}
        {hero ? null : <HeroMark />}

        <div className="relative mx-auto grid w-full max-w-6xl items-center gap-8 px-4 py-14 sm:px-6 lg:grid-cols-[minmax(0,1fr)_auto] lg:py-20">
          <div className="space-y-5">
            <p className="branch-label text-branch-accent-text">
              {dictionary.site.teamNumber}
            </p>
            <h1 className="font-display text-4xl font-black lg:text-5xl">
              {dictionary.site.name}
            </h1>
            {/*
              `--branch-text`, not `--branch-muted`. Sage on ink is only
              5.33:1 before anything sits behind it, and the watermark pushed
              it under AA — this is a primary message, not metadata.
            */}
            <p className="text-branch-text max-w-measure text-lg">
              {dictionary.site.tagline}
            </p>

            <div className="flex flex-wrap gap-3">
              <Link
                to="/$locale/team"
                params={{ locale }}
                className="bg-branch-accent text-branch-accent-contrast inline-flex items-center gap-1.5 rounded-md px-4 py-2 text-sm font-semibold no-underline"
              >
                {dictionary.nav.team}
                <ArrowRight aria-hidden="true" className="size-4" />
              </Link>
              <Link
                to="/$locale/seasons"
                params={{ locale }}
                className="border-branch-border text-branch-text inline-flex items-center rounded-md border px-4 py-2 text-sm font-semibold no-underline"
              >
                {dictionary.nav.seasons}
              </Link>
            </div>
          </div>

          {/* A real hero slide takes the second column when one exists; the
              watermark carries the space on its own when none does. */}
          {hero ? (
            <img
              src={hero.image.url}
              alt={getLocalized(hero.image.alt, locale)?.value ?? ''}
              width={hero.image.width}
              height={hero.image.height}
              fetchPriority="high"
              decoding="async"
              className="w-full rounded-lg object-cover lg:max-w-md"
            />
          ) : null}
        </div>

        {heroCaption ? (
          <p className="text-branch-muted relative mx-auto max-w-6xl px-4 pb-4 text-sm sm:px-6">
            {heroCaption.value}
          </p>
        ) : null}
      </TornSection>

      {awards.length > 0 ? (
        <TornSection branch="non_tech" seed="awards">
          <div className="mx-auto w-full max-w-6xl space-y-4 px-4 py-12 sm:px-6">
            <h2 className="branch-label text-branch-muted">
              {dictionary.meta.awards}
            </h2>
            <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {awards.map((item) => {
                const name = getLocalized(bilingual(item, 'name'), locale)
                return (
                  <li key={item.id}>
                    <Link
                      to="/$locale/seasons/$slug"
                      params={{ locale, slug: item.seasonSlug }}
                      className="border-branch-border block rounded-md border p-4 no-underline"
                    >
                      <span className="bg-branch-accent text-branch-accent-contrast inline-block rounded px-1.5 py-0.5 font-mono text-2xs font-semibold uppercase">
                        {item.eventName}
                      </span>
                      <p className="mt-2 font-semibold">{name?.value}</p>
                      <time
                        dateTime={toIsoDate(item.eventDate)}
                        className="text-branch-muted text-xs"
                      >
                        {formatDate(item.eventDate, locale)}
                      </time>
                    </Link>
                  </li>
                )
              })}
            </ul>
          </div>
        </TornSection>
      ) : null}

      <TornSection branch="tech" seed="stats">
        <div className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6">
          <dl className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
            <Stat label={dictionary.meta.seasons} value={stats.seasons} locale={locale} />
            <Stat label={dictionary.meta.awards} value={stats.awards} locale={locale} />
            <Stat label={dictionary.meta.members} value={stats.members} locale={locale} />
            <Stat
              label={dictionary.nav.performanceNonTech}
              value={stats.outreachEvents}
              locale={locale}
            />
            <Stat
              label={dictionary.meta.peopleReached}
              value={stats.peopleReached}
              locale={locale}
              compact
            />
            <Stat label={dictionary.nav.sponsors} value={stats.sponsors} locale={locale} />
          </dl>
        </div>
      </TornSection>

      {news.length > 0 ? (
        <TornSection branch="non_tech" seed="news">
          <div className="mx-auto w-full max-w-6xl space-y-4 px-4 py-12 sm:px-6">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h2 className="text-2xl font-semibold">{dictionary.nav.news}</h2>
              <Link
                to="/$locale/news"
                params={{ locale }}
                className="text-branch-text text-sm"
              >
                {dictionary.actions.viewAll}
              </Link>
            </div>

            <ul className="grid gap-5 sm:grid-cols-3">
              {news.map((post) => {
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
                          alt=""
                          width={post.coverImage.width}
                          height={post.coverImage.height}
                          loading="lazy"
                          decoding="async"
                          className="aspect-[3/2] w-full rounded-md object-cover"
                        />
                      ) : (
                        <div className="bg-branch-surface aspect-[3/2] w-full rounded-md" />
                      )}
                      <p className="mt-2 font-semibold group-hover:underline">
                        {title?.value}
                      </p>
                      {excerpt ? (
                        <p className="text-branch-muted text-sm">
                          {excerpt.value}
                        </p>
                      ) : null}
                    </Link>
                  </li>
                )
              })}
            </ul>
          </div>
        </TornSection>
      ) : null}

      <TornSection branch="tech" seed="sponsors">
        <div className="mx-auto w-full max-w-6xl space-y-6 px-4 py-12 sm:px-6">
          {sponsors.length > 0 ? (
            <>
              <h2 className="branch-label text-branch-muted">
                {dictionary.nav.sponsors}
              </h2>
              <ul className="flex flex-wrap items-center gap-6">
                {sponsors.map((item) => {
                  const logo = item.logoDark ?? item.logo
                  return (
                    <li key={item.id}>
                      <img
                        src={logo.url}
                        alt={item.name}
                        width={logo.width}
                        height={logo.height}
                        loading="lazy"
                        decoding="async"
                        className="h-10 w-auto object-contain"
                      />
                    </li>
                  )
                })}
              </ul>
            </>
          ) : null}

          <div className="border-branch-border flex flex-wrap items-center justify-between gap-4 rounded-lg border p-6">
            <p className="max-w-measure text-lg font-semibold">
              {dictionary.site.tagline}
            </p>
            <Link
              to="/$locale/sponsors"
              params={{ locale }}
              className="bg-branch-accent text-branch-accent-contrast rounded-md px-4 py-2 text-sm font-semibold no-underline"
            >
              {dictionary.nav.sponsors}
            </Link>
          </div>
        </div>
      </TornSection>
    </main>
  )
}

function Stat({
  label,
  value,
  locale,
  compact = false,
}: {
  label: string
  value: number
  locale: Locale
  compact?: boolean
}) {
  return (
    <div className="space-y-0.5">
      <dd className="font-display text-3xl font-black">
        {compact ? formatCompact(value, locale) : formatNumber(value, locale)}
      </dd>
      <dt className="branch-label text-branch-muted">{label}</dt>
    </div>
  )
}

function HomeError() {
  const dictionary = useDictionary()
  return (
    <BranchTheme branch="tech" as="main" className="min-h-screen">
      <div className="mx-auto w-full max-w-measure space-y-2 px-4 py-16 sm:px-6">
        <h1 className="text-2xl font-semibold">
          {dictionary.errors.serverTitle}
        </h1>
        <p className="text-branch-muted">{dictionary.errors.serverBody}</p>
      </div>
    </BranchTheme>
  )
}
