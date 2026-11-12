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
 * Paper treatment: each sponsor sits in its own light card so any logo —
 * whatever colour it ships in — reads cleanly, which is why the regular
 * `logo` is used rather than `logoDark` (that variant is for a dark ground,
 * and this page's cards are never one).
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
          <div className="zine-card-paper masking-tape relative flex flex-wrap items-center gap-5 rounded-2xl p-6 -rotate-1">
            <OntonSticker
              pose="muchacho"
              locale={locale}
              size="md"
              rotate={-5}
            />
            <p className="text-branch-muted">{dictionary.empty.sponsors}</p>
          </div>
        ) : (
          <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {sponsors.map((sponsor, index) => {
              const logo = sponsor.logo
              const description = getLocalized(
                bilingual(sponsor, 'description'),
                locale,
              )
              const tilt = ((index % 3) - 1) * 1.3

              const cardContent = (
                <>
                  <span
                    aria-hidden="true"
                    className="bg-gold absolute inset-x-0 top-0 h-1.5 rounded-t-xl opacity-90 transition-opacity duration-300 group-hover:opacity-100"
                  />

                  <div
                    className={cn(
                      'ring-branch-border/40 bg-paper relative flex h-24 w-full items-center justify-center overflow-hidden rounded-lg shadow-inner ring-1 transition-transform duration-300 group-hover:scale-102',
                      logo.fit === 'cover' ? 'p-0' : 'p-3',
                    )}
                  >
                    <img
                      src={logo.url}
                      alt={getLocalized(logo.alt, locale)?.value ?? sponsor.name}
                      width={logo.width}
                      height={logo.height}
                      loading={index < 3 ? 'eager' : 'lazy'}
                      decoding="async"
                      className={cn(
                        'h-full w-full drop-shadow-xs',
                        imageFitClass(logo, 'contain'),
                      )}
                    />
                  </div>

                  <div className="border-branch-border mt-3 space-y-1 border-t pt-3">
                    <div className="flex items-center justify-between">
                      <p className="text-ink font-display text-lg font-bold">
                        {sponsor.name}
                      </p>
                      {sponsor.websiteUrl ? (
                        <ExternalLink
                          aria-hidden="true"
                          className="text-slate/60 size-4 shrink-0 transition-transform duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
                        />
                      ) : null}
                    </div>

                    {description ? (
                      <p className="text-slate/80 text-sm leading-relaxed">
                        {description.value}
                      </p>
                    ) : null}
                  </div>
                </>
              )

              return (
                <li
                  key={sponsor.id}
                  style={{ transform: `rotate(${tilt}deg)` }}
                  className="zine-card-paper masking-tape-gold group relative overflow-hidden rounded-2xl p-5 transition-all duration-300 hover:rotate-0"
                >
                  {sponsor.websiteUrl ? (
                    <a
                      href={sponsor.websiteUrl}
                      target="_blank"
                      rel="noreferrer noopener"
                      className="block no-underline"
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

        <aside className="zine-card-paper masking-tape-gold relative flex flex-col justify-between gap-6 rounded-2xl p-6 sm:flex-row sm:items-center sm:p-8 rotate-0.5">
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
