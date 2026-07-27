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
 * Tech treatment: this is a credibility page for companies, and the ink ground
 * is where a logo wall reads best. `logoDark` is preferred here for exactly
 * that reason — §5 exists to let a sponsor supply one.
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
          <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {sponsors.map((sponsor, index) => {
              // The wall sits on ink, so the dark-ground variant wins when the
              // sponsor supplied one.
              const logo = sponsor.logoDark ?? sponsor.logo
              const description = getLocalized(
                bilingual(sponsor, 'description'),
                locale,
              )

              const card = (
                <>
                  <img
                    src={logo.url}
                    alt={getLocalized(logo.alt, locale)?.value ?? sponsor.name}
                    width={logo.width}
                    height={logo.height}
                    loading={index < 3 ? 'eager' : 'lazy'}
                    decoding="async"
                    className="h-16 w-full object-contain object-left"
                  />
                  <div className="mt-3 space-y-1">
                    <p className="flex items-center gap-1.5 font-semibold">
                      {sponsor.name}
                      {sponsor.websiteUrl ? (
                        <ExternalLink
                          aria-hidden="true"
                          className="text-branch-muted size-3.5"
                        />
                      ) : null}
                    </p>
                    {description ? (
                      <p className="text-branch-muted text-sm">
                        {description.value}
                      </p>
                    ) : null}
                  </div>
                </>
              )

              return (
                <li
                  key={sponsor.id}
                  className="border-branch-border rounded-md border p-4"
                >
                  {sponsor.websiteUrl ? (
                    <a
                      href={sponsor.websiteUrl}
                      target="_blank"
                      rel="noreferrer noopener"
                      className="block no-underline"
                    >
                      {card}
                    </a>
                  ) : (
                    card
                  )}
                </li>
              )
            })}
          </ul>
        )}

        {/*
          The ask. A sponsor wall that only lists existing sponsors gives a
          company reading it nothing to do — this is the page they land on
          from the packet, so it has to say the team is open and how to start.
          Gold fill with ink on it, because §7.2 reserves gold for sponsors and
          §7.3 forbids it as a text colour on sage (1.97:1); as a fill behind
          ink it measures 10.50:1.
        */}
        <aside className="border-branch-border bg-branch-text/8 rounded-lg border p-6">
          {/*
            Gold marks this as the sponsor block (§7.2 reserves it for exactly
            that) but as a 2px rule, not a fill. A gold button on the paper
            surface put the page's loudest colour on its largest control, and
            §7.2 also caps accent coverage and asks for chroma to drop as area
            grows.
          */}
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
          {/* No address configured yet — the footer carries the same call, so
              a dead `mailto:` here would be worse than none. */}
          {contactEmail ? (
            <a
              href={`mailto:${contactEmail}`}
              /*
               * Ink on paper: 15.46:1, and it echoes the footer's own ground
               * rather than shouting. The gold rule above already says what
               * kind of block this is.
               */
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
