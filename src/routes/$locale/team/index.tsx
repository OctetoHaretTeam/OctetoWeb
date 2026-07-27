import { createFileRoute } from '@tanstack/react-router'

import { BranchTheme } from '@/components/branch-theme'
import { MemberCard, branchLabel } from '@/components/team/member-card'
import { getDictionary } from '@/i18n/dictionaries'
import { DEFAULT_LOCALE, isLocale } from '@/i18n/locale'
import { useDictionary, useLocale } from '@/i18n/use-locale'
import { getTeamMembers, type TeamMemberSummary } from '@/server/team'

/**
 * The roster — CLAUDE.md §4.
 *
 * Rendered on the non-tech treatment: the team page belongs to the paper
 * layer (§7.1), which is what the `PaperCutout` on each card sits on.
 */
export const Route = createFileRoute('/$locale/team/')({
  loader: () => getTeamMembers(),
  head: ({ params }) => {
    const locale = isLocale(params.locale) ? params.locale : DEFAULT_LOCALE
    const dictionary = getDictionary(locale)
    return {
      meta: [
        { title: `${dictionary.nav.team} — ${dictionary.site.name}` },
        { name: 'description', content: dictionary.site.tagline },
      ],
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
      <div className="mx-auto w-full max-w-6xl space-y-10 px-4 py-10 sm:px-6">
        {/*
          Heading only. The site tagline belongs in the document head and the
          site header, not repeated as a subtitle on every page — a real
          description for this page comes from `teamInfo` once /about lands.
        */}
        <header>
          <h1 className="text-3xl font-semibold lg:text-4xl">
            {dictionary.nav.team}
          </h1>
        </header>

        {grouped.length === 0 ? (
          <EmptyRoster message={dictionary.empty.team} />
        ) : (
          /*
           * Branch groups sit side by side on desktop instead of stacking
           * full-width — a group with one or two members otherwise reads as
           * a lone card floating over a page of empty ground. `auto-fit`
           * collapses tracks with nothing in them, so 2 groups split the
           * width evenly and 4 groups each take a quarter, with no tuning
           * per roster size.
           */
          <div className="grid gap-x-10 gap-y-10 lg:grid-cols-[repeat(auto-fit,minmax(16rem,1fr))] lg:items-start">
            {grouped.map((group, groupIndex) => (
              <section key={group.branch} className="space-y-4">
                <h2 className="branch-label-lg text-branch-muted">
                  {branchLabel(group.branch, dictionary)}
                </h2>
                <ul className="grid grid-cols-2 gap-x-4 gap-y-6 sm:grid-cols-3 lg:grid-cols-[repeat(auto-fit,minmax(9rem,1fr))]">
                  {group.members.map((member, index) => (
                    <MemberCard
                      key={member.slug}
                      member={member}
                      locale={locale}
                      dictionary={dictionary}
                      // Only the first card of the first group is above the fold.
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

function EmptyRoster({ message }: { message: string }) {
  return (
    <div className="border-branch-border max-w-measure rounded-md border border-dashed p-6">
      <p className="text-branch-muted">{message}</p>
    </div>
  )
}

/** Reserves the same grid the roster will occupy, so nothing shifts (§12). */
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

  return (
    <BranchTheme branch="non_tech" as="main" className="min-h-screen">
      <div className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6">
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
