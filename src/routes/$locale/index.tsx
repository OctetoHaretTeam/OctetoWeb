import { ArrowRight, Trophy } from 'lucide-react'
import { Link, createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'

import { BranchTheme } from '@/components/branch-theme'
import { HeroMark } from '@/components/hero-mark'
import {
  HeroSlideshow,
  heroSlideCaption,
  type HeroSlide,
} from '@/components/hero-slideshow'
import { OctetBits, OntonSticker } from '@/components/onton'
import { TornSection } from '@/components/torn-section'
import { getDictionary } from '@/i18n/dictionaries'
import {
  formatCompact,
  formatDate,
  formatNumber,
  toIsoDate,
} from '@/i18n/format'
import { bilingual, getLocalized } from '@/i18n/localized'
import { DEFAULT_LOCALE, type Locale, isLocale } from '@/i18n/locale'
import { useDictionary, useLocale } from '@/i18n/use-locale'
import { imageFitClass } from '@/lib/schemas'
import { buildPageMeta } from '@/lib/site'
import { cn } from '@/lib/utils'
import { getHomeData } from '@/server/home'

export const Route = createFileRoute('/$locale/')({
  loader: () => getHomeData(),
  head: ({ params, loaderData }) => {
    const locale = isLocale(params.locale) ? params.locale : DEFAULT_LOCALE
    const dictionary = getDictionary(locale)
    const title =
      locale === 'ro'
        ? `${dictionary.site.name} (${dictionary.site.teamNumber}) — Echipă de Robotică FIRST Tech Challenge | Chișinău`
        : `${dictionary.site.name} (${dictionary.site.teamNumber}) — FIRST Tech Challenge Robotics Team | Chișinău, Moldova`
    const description =
      locale === 'ro'
        ? `${dictionary.site.name} (Octeto / FTC #25474) — ${dictionary.site.tagline}, IPLT „Spiru Haret” Chișinău, Republica Moldova.`
        : `${dictionary.site.name} (Octeto / FTC #25474) — ${dictionary.site.tagline}, IPLT "Spiru Haret" Chișinău, Moldova.`

    return {
      meta: buildPageMeta({
        title,
        description,
        locale,
        pathname: `/${locale}`,
        image: loaderData?.slides?.[0]?.image.url,
      }),
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
  const [activeSlide, setActiveSlide] = useState<HeroSlide | undefined>(hero)
  const heroCaption = heroSlideCaption(activeSlide, locale)

  return (
    <main>
      {/* ── HERO ────────────────────────────────────────────────────────── */}
      <TornSection
        branch="tech"
        seed="hero"
        torn={false}
        className="overflow-hidden"
      >
        {hero ? null : <HeroMark />}

        <div className="relative mx-auto grid w-full max-w-6xl items-center gap-10 px-4 py-12 sm:px-6 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:py-20">
          <div className="relative z-10 space-y-6">
            <div className="inline-flex flex-wrap items-center gap-3">
              <p className="bg-signal text-ink zine-btn inline-flex items-center gap-2 px-3 py-1 font-mono text-xs font-bold uppercase -rotate-2">
                {dictionary.site.teamNumber}
              </p>
              <OctetBits octetIndex={254} className="text-signal" />
            </div>

            <h1 className="font-display text-4xl font-black tracking-tight sm:text-5xl lg:text-6xl -rotate-1">
              {dictionary.site.name}
            </h1>

            <p className="text-branch-text max-w-measure text-lg leading-relaxed">
              {dictionary.site.tagline}
            </p>

            <div className="flex flex-wrap items-center gap-4 pt-1">
              <Link
                to="/$locale/team"
                params={{ locale }}
                className="bg-branch-accent text-branch-accent-contrast zine-btn inline-flex items-center gap-2 px-5 py-2.5 text-base font-bold no-underline -rotate-1"
              >
                {dictionary.nav.team}
                <ArrowRight aria-hidden="true" className="size-4" />
              </Link>
              <Link
                to="/$locale/seasons"
                params={{ locale }}
                className="bg-paper text-ink zine-btn inline-flex items-center px-5 py-2.5 text-base font-bold no-underline rotate-1"
              >
                {dictionary.nav.seasons}
              </Link>
            </div>
          </div>

          <div className="relative z-10 flex items-center justify-center">
            {hero ? (
              <div className="relative w-full lg:max-w-md">
                <HeroSlideshow
                  slides={slides}
                  locale={locale}
                  onActiveSlideChange={setActiveSlide}
                  className="w-full"
                />
                <div className="absolute -right-2 -bottom-5 z-20 sm:-right-4">
                  <OntonSticker
                    pose="ball"
                    locale={locale}
                    size="sm"
                    rotate={6}
                  />
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center py-4">
                <OntonSticker
                  pose="ball"
                  locale={locale}
                  size="xl"
                  rotate={4}
                />
              </div>
            )}
          </div>
        </div>

        {heroCaption ? (
          <p className="text-branch-muted font-hand relative mx-auto max-w-6xl px-4 pb-6 text-xl sm:px-6">
            {heroCaption.value}
          </p>
        ) : null}
      </TornSection>

      {/* ── AWARDS STRIP ────────────────────────────────────────────────── */}
      {awards.length > 0 ? (
        <TornSection branch="non_tech" seed="awards">
          <div className="mx-auto w-full max-w-6xl space-y-6 px-4 py-14 sm:px-6">
            <h2 className="font-display text-3xl font-black -rotate-1">
              {dictionary.meta.awards}
            </h2>

            <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {awards.map((item, idx) => {
                const name = getLocalized(bilingual(item, 'name'), locale)
                const tilt = idx % 2 === 0 ? '-rotate-1' : 'rotate-1'
                return (
                  <li key={item.id} className="relative">
                    <span
                      aria-hidden="true"
                      className="masking-tape-gold pointer-events-none absolute -top-2.5 left-1/2 z-10 h-5 w-20 -translate-x-1/2 rotate-2"
                    />
                    <Link
                      to="/$locale/seasons/$slug"
                      params={{ locale, slug: item.seasonSlug }}
                      className={`zine-card-paper group block p-5 no-underline transition-transform hover:rotate-0 hover:-translate-y-1 ${tilt}`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="bg-gold text-ink inline-flex items-center gap-1.5 rounded-full border border-black px-2.5 py-0.5 font-mono text-2xs font-bold uppercase">
                          <Trophy aria-hidden="true" className="size-3" />
                          {item.eventName}
                        </span>
                      </div>
                      <p className="font-display text-ink mt-3 text-2xl font-black group-hover:underline">
                        {name?.value}
                      </p>
                      <time
                        dateTime={toIsoDate(item.eventDate)}
                        className="font-hand text-ink/80 mt-1 block text-lg font-bold"
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

      {/* ── STATS ROW ───────────────────────────────────────────────────── */}
      <TornSection branch="tech" seed="stats">
        <div className="mx-auto w-full max-w-6xl px-4 py-14 sm:px-6">
          <dl className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
            <Stat
              label={dictionary.meta.seasons}
              value={stats.seasons}
              locale={locale}
              tilt="-rotate-2"
            />
            <Stat
              label={dictionary.meta.awards}
              value={stats.awards}
              locale={locale}
              tilt="rotate-1"
            />
            <Stat
              label={dictionary.meta.members}
              value={stats.members}
              locale={locale}
              tilt="-rotate-1"
            />
            <Stat
              label={dictionary.nav.performanceNonTech}
              value={stats.outreachEvents}
              locale={locale}
              tilt="rotate-2"
            />
            <Stat
              label={dictionary.meta.peopleReached}
              value={stats.peopleReached}
              locale={locale}
              compact
              tilt="-rotate-2"
            />
            <Stat
              label={dictionary.nav.sponsors}
              value={stats.sponsors}
              locale={locale}
              tilt="rotate-1"
            />
          </dl>
        </div>
      </TornSection>

      {/* ── NEWS ────────────────────────────────────────────────────────── */}
      {news.length > 0 ? (
        <TornSection branch="non_tech" seed="news">
          <div className="mx-auto w-full max-w-6xl space-y-8 px-4 py-14 sm:px-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <h2 className="font-display text-3xl font-black -rotate-1">
                {dictionary.nav.news}
              </h2>

              <Link
                to="/$locale/news"
                params={{ locale }}
                className="zine-btn bg-paper text-ink px-4 py-2 text-sm font-bold no-underline rotate-1"
              >
                {dictionary.actions.viewAll}
              </Link>
            </div>

            <ul className="grid gap-6 sm:grid-cols-3">
              {news.map((post, i) => {
                const title = getLocalized(bilingual(post, 'title'), locale)
                const excerpt = getLocalized(bilingual(post, 'excerpt'), locale)
                const tilt = i % 2 === 0 ? '-rotate-1' : 'rotate-1'

                return (
                  <li key={post.slug} className="relative">
                    <span
                      aria-hidden="true"
                      className="masking-tape pointer-events-none absolute -top-2.5 left-1/2 z-10 h-5 w-20 -translate-x-1/2"
                    />
                    <Link
                      to="/$locale/news/$slug"
                      params={{ locale, slug: post.slug }}
                      className={`zine-card-paper group block p-4 no-underline transition-transform hover:rotate-0 ${tilt}`}
                    >
                      {post.coverImage ? (
                        <img
                          src={post.coverImage.url}
                          alt=""
                          width={post.coverImage.width}
                          height={post.coverImage.height}
                          loading="lazy"
                          decoding="async"
                          className={cn(
                            'aspect-[3/2] w-full rounded-sm',
                            imageFitClass(post.coverImage),
                          )}
                        />
                      ) : (
                        <div className="bg-branch-surface aspect-[3/2] w-full rounded-sm" />
                      )}
                      <p className="font-display text-ink mt-3 text-xl font-bold group-hover:underline">
                        {title?.value}
                      </p>
                      {excerpt ? (
                        <p className="text-ink/80 mt-1 text-sm">
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

      {/* ── SPONSORS & PITCH CTA ────────────────────────────────────────── */}
      <TornSection branch="tech" seed="sponsors">
        <div className="mx-auto w-full max-w-6xl space-y-6 px-4 py-14 sm:px-6">
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
                        className={cn(
                          'h-10 w-24 rounded-xs',
                          imageFitClass(logo, 'contain'),
                        )}
                      />
                    </li>
                  )
                })}
              </ul>
            </>
          ) : null}

          <div className="zine-card bg-carbon relative flex flex-wrap items-center justify-between gap-6 p-6 sm:p-8 -rotate-1">
            <span
              aria-hidden="true"
              className="masking-tape-gold pointer-events-none absolute -top-3 left-10 h-5 w-24 -rotate-3"
            />
            <div className="flex flex-wrap items-center gap-5">
              <OntonSticker
                pose="french"
                locale={locale}
                size="sm"
                rotate={-6}
              />
              <p className="font-display max-w-measure text-lg font-bold">
                {dictionary.sponsorship.shortPitch}
              </p>
            </div>
            <Link
              to="/$locale/sponsors"
              params={{ locale }}
              className="bg-branch-accent text-branch-accent-contrast zine-btn px-5 py-2.5 text-base font-bold no-underline rotate-2"
            >
              {dictionary.nav.sponsors} →
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
  tilt = 'rotate-0',
}: {
  label: string
  value: number
  locale: Locale
  compact?: boolean
  tilt?: string
}) {
  return (
    <div
      className={`zine-card bg-carbon relative flex flex-col justify-between p-4 transition-transform hover:rotate-0 hover:-translate-y-1 ${tilt}`}
    >
      <dd className="font-display text-signal text-3xl font-black sm:text-4xl">
        {compact ? formatCompact(value, locale) : formatNumber(value, locale)}
      </dd>
      <dt className="branch-label text-branch-text/85 mt-2">{label}</dt>
    </div>
  )
}

function HomeError() {
  const dictionary = useDictionary()
  const locale = useLocale()
  return (
    <BranchTheme branch="tech" as="main" className="min-h-screen">
      <div className="mx-auto flex w-full max-w-measure flex-col items-center space-y-4 px-4 py-16 text-center sm:px-6">
        <OntonSticker pose="watahel" locale={locale} size="lg" />
        <h1 className="text-2xl font-semibold">
          {dictionary.errors.serverTitle}
        </h1>
        <p className="text-branch-muted">{dictionary.errors.serverBody}</p>
      </div>
    </BranchTheme>
  )
}
