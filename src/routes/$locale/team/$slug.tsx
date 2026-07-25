import { Link, createFileRoute, notFound } from '@tanstack/react-router'
import { ArrowLeft, ExternalLink } from 'lucide-react'

import { BranchTheme } from '@/components/branch-theme'
import { LocalizedText } from '@/components/localized-text'
import { branchLabel } from '@/components/team/member-card'
import { MemberPhoto } from '@/components/team/member-photo'
import { getDictionary } from '@/i18n/dictionaries'
import { bilingual, getLocalized } from '@/i18n/localized'
import { DEFAULT_LOCALE, isLocale } from '@/i18n/locale'
import { useDictionary, useLocale } from '@/i18n/use-locale'
import { getTeamMember } from '@/server/team'

/**
 * A member profile — the QR destination, and the most important page on the
 * site (CLAUDE.md §4).
 *
 * It has to load fast and stand alone: someone arrives here by scanning a
 * shirt, with no prior page and no warm cache.
 *
 * Every place the member's name appears goes through `publicDisplayName`,
 * including the page title and the `og:` tags — those are the two spots §8
 * calls out specifically, because they are the easiest to forget.
 */
export const Route = createFileRoute('/$locale/team/$slug')({
  loader: async ({ params }) => {
    const member = await getTeamMember({ data: { slug: params.slug } })
    if (!member) throw notFound()
    return member
  },

  head: ({ params, loaderData }) => {
    const locale = isLocale(params.locale) ? params.locale : DEFAULT_LOCALE
    const dictionary = getDictionary(locale)
    if (!loaderData) return { meta: [{ title: dictionary.nav.team }] }

    // Never the full name unless consent was given (§8).
    const displayName = loaderData.displayName
    const role = getLocalized(bilingual(loaderData, 'role'), locale)
    const title = `${displayName} — ${dictionary.site.name}`
    const description = role
      ? `${displayName}, ${role.value}. ${dictionary.site.name}.`
      : dictionary.site.tagline

    return {
      meta: [
        { title },
        { name: 'description', content: description },
        { property: 'og:title', content: title },
        { property: 'og:description', content: description },
        { property: 'og:type', content: 'profile' },
      ],
    }
  },

  component: MemberProfile,
  pendingComponent: ProfilePending,
  notFoundComponent: ProfileNotFound,
  errorComponent: ProfileError,
})

function MemberProfile() {
  const member = Route.useLoaderData()
  const locale = useLocale()
  const dictionary = useDictionary()

  const role = getLocalized(bilingual(member, 'role'), locale)

  return (
    <BranchTheme branch="non_tech" as="main" className="min-h-screen">
      <div className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6">
        <Link
          to="/$locale/team"
          params={{ locale }}
          className="text-branch-muted hover:text-branch-text inline-flex items-center gap-1.5 text-sm no-underline"
        >
          <ArrowLeft aria-hidden="true" className="size-4" />
          {dictionary.nav.team}
        </Link>

        <article className="mt-6 grid gap-6 sm:grid-cols-[minmax(0,14rem)_1fr] sm:gap-8">
          <MemberPhoto
            image={member.image}
            displayName={member.displayName}
            locale={locale}
            seed={member.slug}
            // This is the LCP element on the page a QR code lands on.
            priority
          />

          <div className="space-y-4">
            <header className="space-y-1">
              <p className="branch-label text-branch-muted">
                {branchLabel(member.branch, dictionary)}
              </p>
              <h1 className="text-3xl font-semibold">
                {member.displayName}
              </h1>
              {role ? (
                <p className="text-branch-muted text-lg">{role.value}</p>
              ) : null}
            </header>

            <LocalizedText
              field={bilingual(member, 'description')}
              className="max-w-measure"
            />

            {member.instagramUrl ? (
              <a
                href={member.instagramUrl}
                target="_blank"
                rel="noreferrer noopener"
                className="text-branch-text inline-flex items-center gap-1.5 text-sm"
              >
                <ExternalLink aria-hidden="true" className="size-4" />
                {dictionary.team.instagram}
              </a>
            ) : null}
          </div>
        </article>
      </div>
    </BranchTheme>
  )
}

function ProfilePending() {
  return (
    <BranchTheme branch="non_tech" as="main" className="min-h-screen">
      <div className="mx-auto grid w-full max-w-3xl gap-6 px-4 py-8 sm:grid-cols-[minmax(0,14rem)_1fr] sm:px-6">
        <div className="bg-branch-surface/40 aspect-square w-full rounded" />
        <div className="space-y-3">
          <div className="bg-branch-surface/40 h-3 w-20 rounded" />
          <div className="bg-branch-surface/40 h-8 w-2/3 rounded" />
          <div className="bg-branch-surface/40 h-4 w-1/2 rounded" />
        </div>
      </div>
    </BranchTheme>
  )
}

/**
 * A designed page, not a raw 404 — someone reaching this scanned a shirt whose
 * member has left the team, and the roster is the useful next step.
 */
function ProfileNotFound() {
  const locale = useLocale()
  const dictionary = useDictionary()

  return (
    <BranchTheme branch="non_tech" as="main" className="min-h-screen">
      <div className="mx-auto w-full max-w-measure space-y-4 px-4 py-16 sm:px-6">
        <h1 className="text-2xl font-semibold">
          {dictionary.errors.notFoundTitle}
        </h1>
        <p className="text-branch-muted">{dictionary.errors.notFoundBody}</p>
        <div className="flex flex-wrap gap-3">
          <Link to="/$locale/team" params={{ locale }} className="text-sm">
            {dictionary.errors.goToTeam}
          </Link>
          <Link to="/$locale" params={{ locale }} className="text-sm">
            {dictionary.errors.goHome}
          </Link>
        </div>
      </div>
    </BranchTheme>
  )
}

function ProfileError() {
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
