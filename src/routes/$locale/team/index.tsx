import { createFileRoute } from '@tanstack/react-router'

import { BranchTheme } from '@/components/branch-theme'
import { OntonSticker } from '@/components/onton'
import { MemberCard, branchLabel } from '@/components/team/member-card'
import { getDictionary } from '@/i18n/dictionaries'
import { DEFAULT_LOCALE, isLocale } from '@/i18n/locale'
import { useDictionary, useLocale } from '@/i18n/use-locale'
import { buildPageMeta } from '@/lib/site'
import { getTeamMembers, type TeamMemberSummary } from '@/server/team'

export const Route = createFileRoute('/$locale/team/')({
  loader: () => getTeamMembers(),
  head: ({ params }) => {
    const locale = isLocale(params.locale) ? params.locale : DEFAULT_LOCALE
    const dictionary = getDictionary(locale)
    const title = `${dictionary.nav.team} — ${dictionary.site.name} (${dictionary.site.teamNumber})`
    const description =
      locale === 'ro'
        ? `Membrii, mentorii și voluntarii echipei de robotică ${dictionary.site.name} (Octeto / FTC #25474) din Chișinău.`
        : `Members, mentors, and volunteers of the ${dictionary.site.name} (Octeto / FTC #25474) robotics team in Chișinău, Moldova.`

    return {
      meta: buildPageMeta({
        title,
        description,
        locale,
        pathname: `/${locale}/team`,
      }),
    }
  },
  component: TeamPage,
  pendingComponent: TeamPending,
  errorComponent: TeamError,
})

/** The order the roster reads in. Mentors and volunteers come after members. */
const BRANCH_ORDER = ['tech', 'non_tech', 'mentor', 'volunteer'] as const

function TeamPage() {
  const members = Route.useLoaderData()
  const locale = useLocale()
  const dictionary = useDictionary()

  const grouped = BRANCH_ORDER.map((branch) => ({
    branch,
    members: members.filter((m) => m.branch === branch),
  })).filter((group) => group.members.length > 0)

  return (
    <BranchTheme branch="non_tech" as="main" className="min-h-screen">
      <div className="mx-auto w-full max-w-6xl space-y-12 px-4 py-10 sm:px-6">
        {/*
          Heading only. The site tagline belongs in the document head and the
          site header, not repeated as a subtitle on every page.
        */}
        <header className="flex flex-wrap items-center justify-between gap-6">
          <h1 className="font-display text-4xl font-black lg:text-5xl -rotate-1">
            {dictionary.nav.team}
          </h1>

          <div className="flex items-center gap-4">
            <OntonSticker
              pose="squish"
              locale={locale}
              size="md"
              rotate={-5}
            />
            <OntonSticker pose="ball" locale={locale} size="sm" rotate={6} />
          </div>
        </header>

        {grouped.length === 0 ? (
          <EmptyRoster message={dictionary.empty.team} locale={locale} />
        ) : (
          <div className="grid gap-x-10 gap-y-12 lg:grid-cols-[repeat(auto-fit,minmax(16rem,1fr))] lg:items-start">
            {grouped.map((group, groupIndex) => (
              <section key={group.branch} className="space-y-5">
                <div className="flex items-center gap-2">
                  <h2 className="zine-btn bg-paper text-ink inline-block px-3.5 py-1 text-base font-black -rotate-1">
                    {branchLabel(group.branch, dictionary)}
                  </h2>
                </div>
                <ul className="grid grid-cols-2 gap-x-5 gap-y-8 sm:grid-cols-3 lg:grid-cols-[repeat(auto-fit,minmax(9.5rem,1fr))]">
                  {group.members.map((member, index) => (
                    <MemberCard
                      key={member.slug}
                      member={member}
                      locale={locale}
                      dictionary={dictionary}
                      priority={groupIndex === 0 && index === 0}
                    />
                  ))}
                </ul>
              </section>
            ))}
          </div>
        )}
      </div>
    </BranchTheme>
  )
}

function EmptyRoster({
  message,
  locale,
}: {
  message: string
  locale: 'ro' | 'en'
}) {
  return (
    <div className="zine-card-paper max-w-measure flex items-center gap-4 p-6 -rotate-1">
      <OntonSticker pose="huh" locale={locale} size="sm" />
      <p className="font-hand text-ink text-2xl font-bold">{message}</p>
    </div>
  )
}

function TeamPending() {
  return (
    <BranchTheme branch="non_tech" as="main" className="min-h-screen">
      <div className="mx-auto w-full max-w-6xl space-y-10 px-4 py-10 sm:px-6">
        <div className="bg-branch-surface/40 h-9 w-40 rounded" />
        <ul className="grid grid-cols-2 gap-x-4 gap-y-6 sm:grid-cols-3 lg:grid-cols-[repeat(auto-fit,minmax(9rem,1fr))]">
          {Array.from({ length: 8 }).map((_, i) => (
            <li key={i} className="space-y-3">
              <div className="bg-branch-surface/40 aspect-square w-full rounded" />
              <div className="bg-branch-surface/40 h-4 w-2/3 rounded" />
              <div className="bg-branch-surface/40 h-3 w-1/2 rounded" />
            </li>
          ))}
        </ul>
      </div>
    </BranchTheme>
  )
}

function TeamError() {
  const dictionary = useDictionary()
  const locale = useLocale()

  return (
    <BranchTheme branch="non_tech" as="main" className="min-h-screen">
      <div className="mx-auto flex w-full max-w-6xl flex-col items-center space-y-4 px-4 py-16 text-center sm:px-6">
        <OntonSticker pose="watahel" locale={locale} size="lg" />
        <h1 className="text-2xl font-semibold">
          {dictionary.errors.serverTitle}
        </h1>
        <p className="text-branch-muted mt-2 max-w-measure">
          {dictionary.errors.serverBody}
        </p>
      </div>
    </BranchTheme>
  )
}

export type { TeamMemberSummary }
