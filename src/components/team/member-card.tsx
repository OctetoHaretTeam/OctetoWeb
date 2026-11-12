import { Link } from '@tanstack/react-router'

import { OctetBits } from '@/components/onton'
import { MemberPhoto } from '@/components/team/member-photo'
import type { Dictionary } from '@/i18n/dictionaries'
import { bilingual, getLocalized } from '@/i18n/localized'
import type { Locale } from '@/i18n/locale'
import { hashSeed } from '@/lib/torn-edge'
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

const TILTS = ['-rotate-2', 'rotate-1', '-rotate-1', 'rotate-2'] as const

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
  const tilt = TILTS[hashSeed(member.slug) % TILTS.length]

  return (
    <li className={`transition-transform duration-200 hover:z-10 hover:rotate-0 hover:-translate-y-1.5 ${tilt}`}>
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
        <div className="zine-card-paper mt-2.5 space-y-1 p-3 lg:mt-3">
          <p className="font-display text-ink truncate text-base font-black group-hover:underline lg:text-lg">
            {member.displayName}
          </p>
          {role ? (
            <p className="font-hand text-ink/85 truncate text-lg leading-tight font-bold">
              {role.value}
            </p>
          ) : null}
          <div className="flex flex-wrap items-center justify-between gap-1 pt-1">
            <span className="bg-gold text-ink rounded-full border border-black px-2 py-0.5 font-mono text-2xs font-bold uppercase">
              {branchLabel(member.branch, dictionary)}
            </span>
            <OctetBits octetIndex={member.octetIndex} className="text-ink" />
          </div>
        </div>
      </Link>
    </li>
  )
}
