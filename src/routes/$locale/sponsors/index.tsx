import { ExternalLink, Mail } from 'lucide-react'
import { createFileRoute, getRouteApi } from '@tanstack/react-router'

import { BranchTheme } from '@/components/branch-theme'
import { getDictionary } from '@/i18n/dictionaries'
import { bilingual, getLocalized } from '@/i18n/localized'
import { DEFAULT_LOCALE, isLocale } from '@/i18n/locale'
import { useDictionary, useLocale } from '@/i18n/use-locale'
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
    return {
      meta: [{ title: `${dictionary.nav.sponsors} — ${dictionary.site.name}` }],
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
      <div className="mx-auto w-full max-w-5xl space-y-8 px-4 py-10 sm:px-6">
        <h1 className="text-3xl font-semibold">{dictionary.nav.sponsors}</h1>

        {sponsors.length === 0 ? (
          <div className="border-branch-border max-w-measure rounded-md border border-dashed p-6">
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

              const cardContent = (
                <>
                  {/* Gold marks a sponsor per §7.2. A rule, not a fill — full
                      chroma is fine at this thin, but a whole card in it
                      would blow past the accent-coverage cap. */}
                  <span
                    aria-hidden="true"
                    className="bg-gold absolute inset-x-0 top-0 h-1 rounded-t-xl opacity-90 transition-opacity duration-300 group-hover:opacity-100"
                  />

                  {/* `bg-paper`, not white: white is not in the palette, and
                      paper is already the site's own off-white. */}
                  <div className="ring-branch-border/40 bg-paper relative flex h-24 w-full items-center justify-center rounded-lg p-3 shadow-inner ring-1 transition-transform duration-300 group-hover:scale-102">
                    <img
                      src={logo.url}
                      alt={getLocalized(logo.alt, locale)?.value ?? sponsor.name}
                      width={logo.width}
                      height={logo.height}
                      loading={index < 3 ? 'eager' : 'lazy'}
                      decoding="async"
                      className="max-h-full max-w-full object-contain drop-shadow-xs"
                    />
                  </div>

                  {/* The card is always on `bg-paper` regardless of page
                      branch, so its text is always ink — not `branch-text`,
                      which would flip on a page using the tech ground. */}
                  <div className="border-branch-border mt-3 space-y-1 border-t pt-3">
                    <div className="flex items-center justify-between">
                      <p className="text-ink text-lg font-bold">
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
                  // Same soft cream as the "become a sponsor" card — solid
                  // `bg-paper` read too bright next to sage; the logo badge
                  // below stays solid, since that one exists for logo
                  // legibility rather than as a page surface.
                  className="border-branch-border bg-branch-surface/60 group relative overflow-hidden rounded-xl border p-5 shadow-lg shadow-black/15 transition-all duration-300 hover:-translate-y-1.5 hover:border-gold hover:shadow-2xl hover:shadow-black/20"
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

        {/*
          The ask. A sponsor wall that only lists existing sponsors gives a
          company reading it nothing to do — this is the page they land on
          from the packet, so it has to say the team is open and how to
          start.

          `bg-branch-surface` at full opacity (solid paper) next to sage was
          too sharp a jump; no fill at all read as too flat. This is the
          middle ground — a real cream wash, softened by letting the sage
          show through underneath rather than diluting the paper colour
          itself.
        */}
        <aside className="border-branch-border bg-branch-surface/60 rounded-lg border p-6 shadow-sm">
          <span
            aria-hidden="true"
            className="bg-branch-accent mb-4 block h-0.5 w-10 rounded-full"
          />
          <h2 className="text-xl font-semibold">
            {dictionary.sponsorship.title}
          </h2>
          <p className="text-branch-muted mt-2 max-w-measure text-sm">
            {dictionary.sponsorship.body}
          </p>
          {contactEmail ? (
            <a
              href={`mailto:${contactEmail}`}
              className="bg-branch-text text-branch-surface mt-5 inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-semibold no-underline transition-opacity hover:opacity-90"
            >
              <Mail aria-hidden="true" className="size-4" />
              {dictionary.sponsorship.cta}
            </a>
          ) : null}
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
