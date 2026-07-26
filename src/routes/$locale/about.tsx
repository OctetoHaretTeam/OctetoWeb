import { ExternalLink, Mail, MapPin, Phone } from 'lucide-react'
import { createFileRoute } from '@tanstack/react-router'

import { FallbackNote } from '@/components/localized-text'
import { TornSection } from '@/components/torn-section'
import { getDictionary } from '@/i18n/dictionaries'
import { formatMonthYear } from '@/i18n/format'
import { getLocalized } from '@/i18n/localized'
import { DEFAULT_LOCALE, isLocale } from '@/i18n/locale'
import { useDictionary, useLocale } from '@/i18n/use-locale'
import { getTeamInfo } from '@/server/about'

/**
 * About — CLAUDE.md §4: origin story, photos, contacts.
 *
 * Every social link comes from the `socialLinks` jsonb, including the sister
 * FLL team §1 asks to be linked. Nothing here is hardcoded, so the team can
 * change an account without a deploy.
 */
export const Route = createFileRoute('/$locale/about')({
  loader: () => getTeamInfo(),
  head: ({ params }) => {
    const locale = isLocale(params.locale) ? params.locale : DEFAULT_LOCALE
    const dictionary = getDictionary(locale)
    return {
      meta: [
        { title: `${dictionary.nav.about} — ${dictionary.site.name}` },
        { name: 'description', content: dictionary.site.tagline },
      ],
    }
  },
  component: About,
  errorComponent: AboutError,
})

const SOCIAL_LABELS: Record<string, string> = {
  instagram: 'Instagram',
  tiktok: 'TikTok',
  facebook: 'Facebook',
  youtube: 'YouTube',
  github: 'GitHub',
  instagramFll: 'Instagram · FLL',
}

function About() {
  const info = Route.useLoaderData()
  const locale = useLocale()
  const dictionary = useDictionary()

  if (!info) {
    return (
      <TornSection branch="non_tech" seed="about" torn={false} as="main">
        <div className="mx-auto w-full max-w-measure px-4 py-16 sm:px-6">
          <h1 className="text-3xl font-semibold">{dictionary.nav.about}</h1>
          <p className="text-branch-muted mt-3">{dictionary.empty.team}</p>
        </div>
      </TornSection>
    )
  }

  const story = info.originStoryHtml[locale] ?? info.originStoryHtml.ro
  const isFallback = info.originStoryHtml[locale] === null

  const socials = Object.entries(info.socialLinks ?? {}).filter(
    (entry): entry is [string, string] => typeof entry[1] === 'string',
  )

  return (
    <main>
      <TornSection branch="non_tech" seed="about-story" torn={false}>
        <div className="mx-auto w-full max-w-3xl space-y-6 px-4 py-12 sm:px-6">
          <header className="space-y-2">
            <p className="branch-label text-branch-muted">
              {info.schoolName} · {info.city}
            </p>
            <h1 className="text-3xl font-semibold">{dictionary.nav.about}</h1>
            <p className="text-branch-muted">
              {formatMonthYear(info.foundedDate, locale)}
            </p>
          </header>

          <div>
            <div
              className="prose-body max-w-measure"
              lang={isFallback ? 'ro' : undefined}
              dangerouslySetInnerHTML={{ __html: story }}
            />
            {isFallback ? <FallbackNote locale={locale} /> : null}
          </div>

          {info.gallery.length > 0 ? (
            <ul className="grid gap-3 sm:grid-cols-2">
              {info.gallery.map((image) => (
                <li key={image.url}>
                  <img
                    src={image.url}
                    alt={getLocalized(image.alt, locale)?.value ?? ''}
                    width={image.width}
                    height={image.height}
                    loading="lazy"
                    decoding="async"
                    className="w-full rounded-md"
                  />
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      </TornSection>

      <TornSection branch="tech" seed="about-contact">
        <div className="mx-auto w-full max-w-3xl space-y-5 px-4 py-12 sm:px-6">
          <h2 className="text-2xl font-semibold">
            {dictionary.actions.contact}
          </h2>

          <ul className="space-y-2 text-sm">
            <li className="flex items-center gap-2">
              <Mail aria-hidden="true" className="text-branch-muted size-4" />
              <a href={`mailto:${info.contactEmail}`}>{info.contactEmail}</a>
            </li>
            {info.phone ? (
              <li className="flex items-center gap-2">
                <Phone aria-hidden="true" className="text-branch-muted size-4" />
                <a href={`tel:${info.phone.replace(/\s+/g, '')}`}>{info.phone}</a>
              </li>
            ) : null}
            <li className="flex items-center gap-2">
              <MapPin aria-hidden="true" className="text-branch-muted size-4" />
              <span>
                {info.schoolName}, {info.city}, {info.country}
              </span>
            </li>
          </ul>

          {socials.length > 0 ? (
            <ul className="flex flex-wrap gap-3">
              {socials.map(([key, url]) => (
                <li key={key}>
                  <a
                    href={url}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="border-branch-border inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-sm no-underline"
                  >
                    {SOCIAL_LABELS[key] ?? key}
                    <ExternalLink aria-hidden="true" className="size-3.5" />
                  </a>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      </TornSection>
    </main>
  )
}

function AboutError() {
  const dictionary = useDictionary()
  return (
    <TornSection branch="tech" seed="about-error" torn={false} as="main">
      <div className="mx-auto w-full max-w-measure space-y-2 px-4 py-16 sm:px-6">
        <h1 className="text-2xl font-semibold">
          {dictionary.errors.serverTitle}
        </h1>
        <p className="text-branch-muted">{dictionary.errors.serverBody}</p>
      </div>
    </TornSection>
  )
}
