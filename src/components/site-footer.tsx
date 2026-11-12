import { ExternalLink, Mail, MapPin, Phone } from 'lucide-react'

import { OctetBits, OntonSticker } from '@/components/onton'
import { TornSection } from '@/components/torn-section'
import { useDictionary, useLocale } from '@/i18n/use-locale'
import type { ContactInfo } from '@/server/contact'

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
  const locale = useLocale()

  if (!info) return null

  const socials = Object.entries(info.socialLinks ?? {}).filter(
    (entry): entry is [string, string] => typeof entry[1] === 'string',
  )

  return (
    <TornSection branch="tech" seed="site-footer" as="footer" outlined>
      <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6">
        <div className="grid items-center gap-6 lg:grid-cols-[1fr_auto]">
          <div className="space-y-4">
            <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
              <h2 className="font-display text-2xl font-black -rotate-1">
                {dictionary.contact.title}
              </h2>
              <p className="font-hand text-signal text-xl">
                {dictionary.contact.lead}
              </p>
            </div>

            <ul className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
              <li className="flex items-center gap-2">
                <Mail
                  aria-hidden="true"
                  className="text-branch-accent-text size-4 shrink-0"
                />
                <a
                  href={`mailto:${info.contactEmail}`}
                  className="text-branch-text wavy-underline font-semibold"
                >
                  {info.contactEmail}
                </a>
              </li>

              {info.phone ? (
                <li className="flex items-center gap-2">
                  <Phone
                    aria-hidden="true"
                    className="text-branch-accent-text size-4 shrink-0"
                  />
                  <a
                    href={`tel:${info.phone.replace(/\s+/g, '')}`}
                    className="text-branch-text wavy-underline font-semibold"
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

            <div className="flex flex-wrap items-center gap-x-4 gap-y-3 pt-1">
              {socials.length > 0 ? (
                <ul className="flex flex-wrap gap-2.5">
                  {socials.map(([key, url], i) => (
                    <li key={key}>
                      <a
                        href={url}
                        target="_blank"
                        rel="noreferrer noopener"
                        className={`zine-btn bg-carbon text-paper hover:bg-signal hover:text-ink inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold no-underline ${i % 2 === 0 ? '-rotate-1' : 'rotate-1'}`}
                      >
                        {SOCIAL_LABELS[key] ?? key}
                        <ExternalLink aria-hidden="true" className="size-3" />
                      </a>
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
          </div>

          <div className="flex items-center gap-4">
            <OntonSticker pose="blob" locale={locale} size="sm" rotate={-6} />
            <OntonSticker pose="cofe" locale={locale} size="sm" rotate={5} />
          </div>
        </div>

        <div className="border-branch-border mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-dashed pt-4 text-xs">
          <div className="text-signal flex items-center gap-2 font-mono">
            <OctetBits octetIndex={0b10100101} />
          </div>
          <p className="text-branch-muted">
            © {new Date().getFullYear()} {dictionary.site.name} ({dictionary.site.teamNumber}).{' '}
            {dictionary.site.copyright}.
          </p>
        </div>
      </div>
    </TornSection>
  )
}
