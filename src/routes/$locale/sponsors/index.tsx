import { ExternalLink, Mail } from 'lucide-react'
import { createFileRoute, getRouteApi } from '@tanstack/react-router'

import { BranchTheme } from '@/components/branch-theme'
import { OntonSticker } from '@/components/onton'
import { getDictionary } from '@/i18n/dictionaries'
import { bilingual, getLocalized } from '@/i18n/localized'
import { DEFAULT_LOCALE, isLocale } from '@/i18n/locale'
import { useDictionary, useLocale } from '@/i18n/use-locale'
import { imageFitClass } from '@/lib/schemas'
import { buildPageMeta } from '@/lib/site'
import { cn } from '@/lib/utils'
import { getSponsors } from '@/server/sponsors'

/**
 * The sponsor wall — CLAUDE.md §4.
 *
 * Paper treatment: each sponsor sits in a roomy zine card, with a framed
 * mid-sage logo stage (transparent image fill + subtle center lift) so both
 * light/white marks and dark brand marks read clearly.
 */
export const Route = createFileRoute('/$locale/sponsors/')({
  loader: () => getSponsors(),
  head: ({ params }) => {
    const locale = isLocale(params.locale) ? params.locale : DEFAULT_LOCALE
    const dictionary = getDictionary(locale)
    const title = `${dictionary.nav.sponsors} — ${dictionary.site.name} (${dictionary.site.teamNumber})`
    const description = `${dictionary.sponsorship.shortPitch} — ${dictionary.site.name} (FTC #25474).`

    return {
      meta: buildPageMeta({
        title,
        description,
        locale,
        pathname: `/${locale}/sponsors`,
      }),
    }
  },
  component: SponsorWall,
  errorComponent: SponsorsError,
})

// The contact singleton is already loaded once by the locale layout for the
// footer; reading it from there costs no extra query.
const localeRoute = getRouteApi('/$locale')

function SponsorWall() {
  const sponsors = Route.useLoaderData()
  const contact = localeRoute.useLoaderData()
  const locale = useLocale()
  const dictionary = useDictionary()
  const contactEmail = contact?.contactEmail

  return (
    <BranchTheme branch="non_tech" as="main" className="min-h-screen">
      <div className="mx-auto w-full max-w-5xl space-y-10 px-4 py-10 sm:px-6">
        <header>
          <h1 className="text-3xl font-bold sm:text-4xl">
            {dictionary.nav.sponsors}
          </h1>
        </header>

        {sponsors.length === 0 ? (
          <div className="zine-card-paper relative flex flex-wrap items-center gap-5 rounded-2xl p-6 -rotate-1">
            <span
              aria-hidden="true"
              className="masking-tape pointer-events-none absolute -top-2.5 left-1/2 z-10 h-5 w-20 -translate-x-1/2 -rotate-2"
            />
            <OntonSticker
              pose="muchacho"
              locale={locale}
              size="md"
              rotate={-5}
            />
            <p className="text-branch-muted">{dictionary.empty.sponsors}</p>
          </div>
        ) : (
          <ul className="grid gap-7 md:grid-cols-2">
            {sponsors.map((sponsor, index) => {
              const logo = sponsor.logo
              const description = getLocalized(
                bilingual(sponsor, 'description'),
                locale,
              )
              const tilt = ((index % 2 === 0 ? -1 : 1) * 0.8).toFixed(1)
              const hostLabel = sponsor.websiteUrl
                ? formatSponsorHost(sponsor.websiteUrl)
                : null

              const cardContent = (
                <div className="flex h-full flex-col">
                  <div
                    className={cn(
                      'border-ink bg-sage bg-[radial-gradient(ellipse_at_center,color-mix(in_srgb,var(--color-paper)_26%,var(--color-sage)_74%),var(--color-sage)_78%)] relative flex h-32 w-full items-center justify-center overflow-hidden rounded-xl border-2 shadow-inner transition-transform duration-300 group-hover:scale-[1.015] sm:h-36',
                      logo.fit === 'cover' ? 'p-0' : 'p-4',
                    )}
                  >
                    <img
                      src={logo.url}
                      alt={getLocalized(logo.alt, locale)?.value ?? sponsor.name}
                      width={logo.width}
                      height={logo.height}
                      loading={index < 4 ? 'eager' : 'lazy'}
                      decoding="async"
                      className={cn(
                        'h-full w-full !bg-transparent drop-shadow-[0_1px_2px_rgba(10,12,9,0.38)]',
                        imageFitClass(logo, 'contain'),
                      )}
                    />
                  </div>

                  <div className="mt-4 flex flex-1 flex-col gap-2.5">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <h2 className="text-ink font-display text-xl font-black sm:text-2xl">
                        {sponsor.name}
                      </h2>
                      {hostLabel ? (
                        <span className="border-ink bg-gold/65 text-ink inline-flex shrink-0 items-center gap-1 rounded-full border px-2.5 py-0.5 font-mono text-2xs font-bold transition-colors group-hover:bg-gold">
                          {hostLabel}
                          <ExternalLink
                            aria-hidden="true"
                            className="size-3 shrink-0"
                          />
                        </span>
                      ) : null}
                    </div>

                    {description ? (
                      <p className="text-ink/85 text-sm leading-relaxed sm:text-[15px]">
                        {description.value}
                      </p>
                    ) : null}
                  </div>
                </div>
              )

              return (
                <li
                  key={sponsor.id}
                  style={{ transform: `rotate(${tilt}deg)` }}
                  className="zine-card-paper group relative rounded-2xl p-5 transition-all duration-300 hover:rotate-0 sm:p-6"
                >
                  <span
                    aria-hidden="true"
                    className="masking-tape-gold pointer-events-none absolute -top-2.5 left-1/2 z-10 h-5 w-20 -translate-x-1/2 rotate-1"
                  />
                  {sponsor.websiteUrl ? (
                    <a
                      href={sponsor.websiteUrl}
                      target="_blank"
                      rel="noreferrer noopener"
                      className="block h-full no-underline"
                    >
                      {cardContent}
                    </a>
                  ) : (
                    cardContent
                  )}
                </li>
              )
            })}
          </ul>
        )}

        <aside className="zine-card-paper relative flex flex-col justify-between gap-6 rounded-2xl p-6 sm:flex-row sm:items-center sm:p-8 rotate-0.5">
          <span
            aria-hidden="true"
            className="masking-tape-gold pointer-events-none absolute -top-2.5 left-12 z-10 h-5 w-24 -rotate-2"
          />
          <div className="space-y-2">
            <h2 className="text-2xl font-bold">
              {dictionary.sponsorship.title}
            </h2>
            <p className="text-branch-muted max-w-measure text-sm">
              {dictionary.sponsorship.body}
            </p>
            {contactEmail ? (
              <div className="pt-2">
                <a
                  href={`mailto:${contactEmail}`}
                  className="zine-btn bg-branch-accent text-branch-accent-contrast inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold no-underline -rotate-1"
                >
                  <Mail aria-hidden="true" className="size-4" />
                  {dictionary.sponsorship.cta}
                </a>
              </div>
            ) : null}
          </div>
          <OntonSticker pose="ball" locale={locale} size="lg" rotate={-6} />
        </aside>
      </div>
    </BranchTheme>
  )
}

function SponsorsError() {
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

function formatSponsorHost(rawUrl: string): string {
  try {
    return new URL(rawUrl).hostname.replace(/^www\./, '')
  } catch {
    return rawUrl.replace(/^https?:\/\/(www\.)?/, '').split('/')[0] ?? rawUrl
  }
}
