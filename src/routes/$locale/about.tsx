import { createFileRoute } from '@tanstack/react-router'

import { FallbackNote } from '@/components/localized-text'
import { OctetBits, OntonSticker } from '@/components/onton'
import { TornSection } from '@/components/torn-section'
import { getDictionary } from '@/i18n/dictionaries'
import { formatMonthYear } from '@/i18n/format'
import { getLocalized } from '@/i18n/localized'
import { DEFAULT_LOCALE, isLocale } from '@/i18n/locale'
import { useDictionary, useLocale } from '@/i18n/use-locale'
import { imageFitClass } from '@/lib/schemas'
import { buildPageMeta } from '@/lib/site'
import { cn } from '@/lib/utils'
import { getTeamInfo } from '@/server/about'

/**
 * About — CLAUDE.md §4: origin story, photos, contacts.
 *
 * Every social link comes from the `socialLinks` jsonb, including the sister
 * FLL team §1 asks to be linked. Nothing here is hardcoded, so the team can
 * change an account without a deploy.
 */
export const Route = createFileRoute('/$locale/about')({
  loader: () => getTeamInfo(),
  head: ({ params, loaderData }) => {
    const locale = isLocale(params.locale) ? params.locale : DEFAULT_LOCALE
    const dictionary = getDictionary(locale)
    const title = `${dictionary.nav.about} — ${dictionary.site.name} (${dictionary.site.teamNumber})`
    const description =
      locale === 'ro'
        ? `Povestea echipei ${dictionary.site.name} (Octeto / FTC #25474) de la IPLT „Spiru Haret” din Chișinău.`
        : `The story of ${dictionary.site.name} (Octeto / FTC #25474) from IPLT "Spiru Haret" in Chișinău, Moldova.`

    return {
      meta: buildPageMeta({
        title,
        description,
        locale,
        pathname: `/${locale}/about`,
        image: loaderData?.gallery?.[0]?.url,
      }),
    }
  },
  component: About,
  errorComponent: AboutError,
})

function About() {
  const info = Route.useLoaderData()
  const locale = useLocale()
  const dictionary = useDictionary()

  if (!info) {
    return (
      <TornSection branch="non_tech" seed="about" torn={false} as="main">
        <div className="mx-auto w-full max-w-measure px-4 py-16 sm:px-6">
          <OntonSticker pose="huh" locale={locale} size="lg" rotate={-5} />
          <h1 className="mt-4 text-3xl font-bold">{dictionary.nav.about}</h1>
          <p className="text-branch-muted mt-3">{dictionary.empty.team}</p>
        </div>
      </TornSection>
    )
  }

  const story = info.originStoryHtml[locale] ?? info.originStoryHtml.ro
  const isFallback = info.originStoryHtml[locale] === null

  return (
    <main>
      <TornSection branch="non_tech" seed="about-story" torn={false}>
        <div className="mx-auto w-full max-w-4xl space-y-10 px-4 py-12 sm:px-6">
          <header className="flex flex-wrap items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-3">
                <p className="branch-label text-branch-muted">
                  {info.schoolName} · {info.city}
                </p>
                <OctetBits />
              </div>
              <h1 className="text-3xl font-bold sm:text-5xl">
                {dictionary.nav.about}
              </h1>
              <p className="text-branch-muted text-sm">
                {formatMonthYear(info.foundedDate, locale)}
              </p>
            </div>
            <OntonSticker
              pose="cai-verzi"
              locale={locale}
              size="lg"
              rotate={6}
              floating
            />
          </header>

          <div className="zine-card-paper relative rounded-2xl p-6 sm:p-8 -rotate-0.5">
            <span
              aria-hidden="true"
              className="masking-tape pointer-events-none absolute -top-2.5 left-12 z-10 h-5 w-24 -rotate-2"
            />
            <div
              className="prose-body max-w-measure"
              lang={isFallback ? 'ro' : undefined}
              dangerouslySetInnerHTML={{ __html: story }}
            />
            {isFallback ? <FallbackNote locale={locale} /> : null}
          </div>

          {info.gallery.length > 0 ? (
            <ul className="grid gap-4 sm:grid-cols-2">
              {info.gallery.map((image, idx) => (
                <li
                  key={image.url}
                  style={{
                    transform: `rotate(${idx % 2 === 0 ? -1.2 : 1.2}deg)`,
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
        </div>
      </TornSection>
    </main>
  )
}

function AboutError() {
  const dictionary = useDictionary()
  return (
    <TornSection branch="non_tech" seed="about-error" torn={false} as="main">
      <div className="mx-auto w-full max-w-measure space-y-2 px-4 py-16 sm:px-6">
        <h1 className="text-2xl font-semibold">
          {dictionary.errors.serverTitle}
        </h1>
        <p className="text-branch-muted">{dictionary.errors.serverBody}</p>
      </div>
    </TornSection>
  )
}
