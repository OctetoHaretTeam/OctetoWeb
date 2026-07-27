import { Link } from '@tanstack/react-router'

import { MemberPhoto } from '@/components/team/member-photo'
import type { Dictionary } from '@/i18n/dictionaries'
import { bilingual, getLocalized } from '@/i18n/localized'
import type { Locale } from '@/i18n/locale'
import type { TeamMemberSummary } from '@/server/team'

/** Branch enum to the label the public sees. */
export function branchLabel(
  branch: TeamMemberSummary['branch'],
  dictionary: Dictionary,
): string {
  switch (branch) {
    case 'tech':
      return dictionary.team.branchTech
    case 'non_tech':
      return dictionary.team.branchNonTech
    case 'mentor':
      return dictionary.team.branchMentor
    case 'volunteer':
      return dictionary.team.branchVolunteer
  }
}

export function MemberCard({
  member,
  locale,
  dictionary,
  priority = false,
}: {
  member: TeamMemberSummary
  locale: Locale
  dictionary: Dictionary
  priority?: boolean
}) {
  const role = getLocalized(bilingual(member, 'role'), locale)

  return (
    <li>
      <Link
        to="/$locale/team/$slug"
        params={{ locale, slug: member.slug }}
        className="group block no-underline"
      >
        <MemberPhoto
          image={member.image}
          displayName={member.displayName}
          locale={locale}
          seed={member.slug}
          priority={priority}
        />
        <div className="mt-2 space-y-0.5 lg:mt-3">
          <p className="text-branch-text truncate font-semibold group-hover:underline lg:text-lg">
            {member.displayName}
          </p>
          {role ? (
            <p className="text-branch-muted truncate text-sm lg:text-base">
              {role.value}
            </p>
          ) : null}
          <p className="branch-label text-branch-muted">
            {branchLabel(member.branch, dictionary)}
          </p>
        </div>
      </Link>
    </li>
  )
}
