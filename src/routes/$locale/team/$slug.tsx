import { Link, createFileRoute, notFound } from '@tanstack/react-router'
import { ArrowLeft, ExternalLink } from 'lucide-react'

import { BranchTheme } from '@/components/branch-theme'
import { LocalizedText } from '@/components/localized-text'
import { OctetBits, OntonSticker, ontonPoseForSeed } from '@/components/onton'
import { branchLabel } from '@/components/team/member-card'
import { MemberPhoto } from '@/components/team/member-photo'
import { getDictionary } from '@/i18n/dictionaries'
import { bilingual, getLocalized } from '@/i18n/localized'
import { DEFAULT_LOCALE, isLocale } from '@/i18n/locale'
import { useDictionary, useLocale } from '@/i18n/use-locale'
import { buildPageMeta } from '@/lib/site'
import { getTeamMember } from '@/server/team'

export const Route = createFileRoute('/$locale/team/$slug')({
  loader: async ({ params }) => {
    const member = await getTeamMember({ data: { slug: params.slug } })
    if (!member) throw notFound()
    return member
  },

  head: ({ params, loaderData }) => {
    const locale = isLocale(params.locale) ? params.locale : DEFAULT_LOCALE
    const dictionary = getDictionary(locale)
    if (!loaderData) {
      return {
        meta: buildPageMeta({
          title: `${dictionary.nav.team} — ${dictionary.site.name}`,
          description: dictionary.site.tagline,
          locale,
          pathname: `/${locale}/team/${params.slug}`,
        }),
      }
    }

    const displayName = loaderData.displayName
    const role = getLocalized(bilingual(loaderData, 'role'), locale)
    const title = `${displayName} — ${dictionary.site.name} (${dictionary.site.teamNumber})`
    const description = role
      ? `${displayName}, ${role.value} — ${dictionary.site.name} (FTC #25474).`
      : `${displayName} — ${dictionary.site.name} (FTC #25474).`

    return {
      meta: buildPageMeta({
        title,
        description,
        locale,
        pathname: `/${locale}/team/${loaderData.slug}`,
        image: loaderData.image?.url,
        imageAlt: displayName,
        type: 'profile',
      }),
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
  const buddyPose = ontonPoseForSeed(`${member.slug}-buddy`)

  return (
    <BranchTheme branch="non_tech" as="main" className="min-h-screen">
      <div className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6">
        <Link
          to="/$locale/team"
          params={{ locale }}
          className="zine-btn bg-paper text-ink inline-flex items-center gap-1.5 px-3 py-1 text-sm font-bold no-underline -rotate-1"
        >
          <ArrowLeft aria-hidden="true" className="size-4" />
          {dictionary.nav.team}
        </Link>

        <article className="mt-8 grid items-start gap-8 sm:grid-cols-[minmax(0,15rem)_1fr]">
          <div className="-rotate-2">
            <MemberPhoto
              image={member.image}
              displayName={member.displayName}
              locale={locale}
              seed={member.slug}
              priority
            />
          </div>

          <div className="zine-card-paper relative space-y-4 p-6 rotate-1">
            <span
              aria-hidden="true"
              className="masking-tape-gold pointer-events-none absolute -top-2.5 left-10 h-5 w-20 -rotate-2"
            />
            <header className="space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="bg-gold text-ink rounded-full border border-black px-3 py-0.5 font-mono text-xs font-bold uppercase">
                  {branchLabel(member.branch, dictionary)}
                </span>
                <div className="flex items-center gap-2 font-mono text-xs">
                  <OctetBits octetIndex={member.octetIndex} />
                  <span>#{member.octetIndex}</span>
                </div>
              </div>
              <h1 className="font-display text-3xl font-black sm:text-4xl">
                {member.displayName}
              </h1>
              {role ? (
                <p className="font-hand text-ink/85 text-2xl font-bold">
                  {role.value}
                </p>
              ) : null}
            </header>

            <LocalizedText
              field={bilingual(member, 'description')}
              className="max-w-measure"
            />

            <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
              {member.instagramUrl ? (
                <a
                  href={member.instagramUrl}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="zine-btn bg-gold text-ink inline-flex items-center gap-1.5 px-3.5 py-1.5 text-sm font-bold no-underline -rotate-1"
                >
                  <ExternalLink aria-hidden="true" className="size-4" />
                  {dictionary.team.instagram}
                </a>
              ) : (
                <span />
              )}

              <OntonSticker
                pose={buddyPose}
                locale={locale}
                size="sm"
                rotate={6}
              />
            </div>
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

function ProfileNotFound() {
  const locale = useLocale()
  const dictionary = useDictionary()

  return (
    <BranchTheme branch="non_tech" as="main" className="min-h-screen">
      <div className="mx-auto flex w-full max-w-measure flex-col items-center space-y-5 px-4 py-16 text-center sm:px-6">
        <OntonSticker pose="watahel" locale={locale} size="lg" />
        <h1 className="font-display text-3xl font-black">
          {dictionary.errors.notFoundTitle}
        </h1>
        <p className="text-branch-muted">{dictionary.errors.notFoundBody}</p>
        <div className="flex flex-wrap gap-3">
          <Link
            to="/$locale/team"
            params={{ locale }}
            className="zine-btn bg-gold text-ink px-4 py-2 text-sm font-bold no-underline"
          >
            {dictionary.errors.goToTeam}
          </Link>
          <Link
            to="/$locale"
            params={{ locale }}
            className="zine-btn bg-paper text-ink px-4 py-2 text-sm font-bold no-underline"
          >
            {dictionary.errors.goHome}
          </Link>
        </div>
      </div>
    </BranchTheme>
  )
}

function ProfileError() {
  const dictionary = useDictionary()
  const locale = useLocale()

  return (
    <BranchTheme branch="non_tech" as="main" className="min-h-screen">
      <div className="mx-auto flex w-full max-w-measure flex-col items-center space-y-4 px-4 py-16 text-center sm:px-6">
        <OntonSticker pose="arson" locale={locale} size="lg" />
        <h1 className="text-2xl font-semibold">
          {dictionary.errors.serverTitle}
        </h1>
        <p className="text-branch-muted">{dictionary.errors.serverBody}</p>
      </div>
    </BranchTheme>
  )
}
