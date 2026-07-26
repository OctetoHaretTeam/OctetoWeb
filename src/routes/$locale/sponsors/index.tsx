import { ExternalLink } from 'lucide-react'
import { createFileRoute } from '@tanstack/react-router'

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

function SponsorWall() {
  const sponsors = Route.useLoaderData()
  const locale = useLocale()
  const dictionary = useDictionary()

  return (
    <BranchTheme branch="tech" as="main" className="min-h-screen">
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
      </div>
    </BranchTheme>
  )
}

function SponsorsError() {
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
