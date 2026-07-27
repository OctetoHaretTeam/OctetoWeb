import { ExternalLink, Mail, MapPin, Phone } from 'lucide-react'

import { TornSection } from '@/components/torn-section'
import { useDictionary } from '@/i18n/use-locale'
import type { ContactInfo } from '@/server/contact'

/**
 * "Get in touch" — the same contact block on every public page (CLAUDE.md §4).
 *
 * Kept on the DIGITAL layer (`branch="tech"`, ink) while the pages above it
 * sit on the paper layer. That contrast is what marks it as chrome rather
 * than more page (§7.1).
 *
 * Deliberately COMPACT. It repeats on every route, so it is a footer, not a
 * contact page: one row of details, one row of socials, one line of credit.
 * The bordered cell grid it started as was taller than some of the pages it
 * sat under.
 */

const SOCIAL_LABELS: Record<string, string> = {
  instagram: 'Instagram',
  tiktok: 'TikTok',
  facebook: 'Facebook',
  youtube: 'YouTube',
  github: 'GitHub',
  instagramFll: 'Instagram · FLL',
}

export function SiteFooter({ info }: { info: ContactInfo }) {
  const dictionary = useDictionary()

  // Nothing to show and nothing honest to put in its place — §13 says an
  // empty state is an invitation, not an apology, and a contact block with no
  // contacts is neither.
  if (!info) return null

  const socials = Object.entries(info.socialLinks ?? {}).filter(
    (entry): entry is [string, string] => typeof entry[1] === 'string',
  )

  return (
    // `outlined`: the home page ends on an ink section, so the tear would be
    // black on black. Stroking the torn edge draws the boundary in the shape
    // the site already uses, and unlike a rule or a divider row it adds no
    // height at all.
    <TornSection branch="tech" seed="site-footer" as="footer" outlined>
      <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6">
        <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
          <h2 className="font-display text-lg font-black">
            {dictionary.contact.title}
          </h2>
          <p className="text-branch-muted text-sm">{dictionary.contact.lead}</p>
        </div>

        {/*
          One inline row, not a bordered cell per detail. Each item keeps its
          icon so the three read apart at a glance, and wraps to its own line
          on a narrow screen without any of them growing a box.
        */}
        <ul className="mt-3 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
          <li className="flex items-center gap-2">
            <Mail
              aria-hidden="true"
              className="text-branch-accent-text size-4 shrink-0"
            />
            <a
              href={`mailto:${info.contactEmail}`}
              className="text-branch-text no-underline hover:underline"
            >
              {info.contactEmail}
            </a>
          </li>

          {/*
            Optional in the schema (§5) and optional here — the item is omitted
            rather than shown empty, so adding a number in admin is all it
            takes to make it appear.
          */}
          {info.phone ? (
            <li className="flex items-center gap-2">
              <Phone
                aria-hidden="true"
                className="text-branch-accent-text size-4 shrink-0"
              />
              <a
                href={`tel:${info.phone.replace(/\s+/g, '')}`}
                className="text-branch-text no-underline hover:underline"
              >
                {info.phone}
              </a>
            </li>
          ) : null}

          <li className="text-branch-muted flex items-center gap-2">
            <MapPin
              aria-hidden="true"
              className="text-branch-accent-text size-4 shrink-0"
            />
            <span>
              {info.schoolName}, {info.city}, {info.country}
            </span>
          </li>
        </ul>

        <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-3">
          {socials.length > 0 ? (
            <ul className="flex flex-wrap gap-2">
              {socials.map(([key, url]) => (
                <li key={key}>
                  <a
                    href={url}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="border-branch-border text-branch-text hover:border-branch-accent inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs no-underline transition-colors"
                  >
                    {SOCIAL_LABELS[key] ?? key}
                    <ExternalLink aria-hidden="true" className="size-3" />
                  </a>
                </li>
              ))}
            </ul>
          ) : null}

          {/*
            The privacy page §8 calls for does not exist yet. A link to it
            belongs on this line once it does — omitted rather than pointed
            at a 404.
          */}
          <p className="text-branch-muted ml-auto text-xs">
            {dictionary.site.name} · {dictionary.site.teamNumber}
          </p>
        </div>
      </div>
    </TornSection>
  )
}
