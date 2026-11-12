import { Link, createFileRoute } from '@tanstack/react-router'

import { BranchTheme } from '@/components/branch-theme'
import { OntonSticker } from '@/components/onton'
import { getDictionary } from '@/i18n/dictionaries'
import { DEFAULT_LOCALE } from '@/i18n/locale'
import { resolveLocale } from '@/i18n/resolve-locale'

/**
 * Where an unknown or retired QR code lands — CLAUDE.md §6.
 *
 * A designed page, never a raw 404. Someone reaching this has physically
 * scanned something the team printed, so the useful answer is a way in — the
 * roster and the home page — not an error.
 *
 * Not locale-prefixed, because there is no locale in the URL to read: the
 * locale is resolved the same way the resolver itself resolves it.
 */
export const Route = createFileRoute('/q/unknown')({
  loader: () => ({ locale: resolveLocale() ?? DEFAULT_LOCALE }),
  head: () => ({
    meta: [
      { title: 'Cod necunoscut — OctetoHaret' },
      { name: 'robots', content: 'noindex, nofollow' },
    ],
  }),
  component: UnknownCode,
})

function UnknownCode() {
  const { locale } = Route.useLoaderData()
  const dictionary = getDictionary(locale)

  return (
    <BranchTheme
      branch="non_tech"
      as="main"
      className="flex min-h-screen items-center"
    >
      <div className="mx-auto w-full max-w-xl px-4 py-16 sm:px-6">
        <div className="zine-card-paper masking-tape relative space-y-5 rounded-2xl p-6 sm:p-8 -rotate-1">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <OntonSticker
              pose="watahel"
              locale={locale}
              size="lg"
              rotate={-6}
              floating
            />
            <OntonSticker pose="huh" locale={locale} size="md" rotate={8} />
          </div>

          <p className="branch-label text-branch-muted">
            {dictionary.site.teamNumber}
          </p>
          <h1 className="text-3xl font-bold">
            {dictionary.errors.notFoundTitle}
          </h1>
          <p className="text-branch-muted">{dictionary.errors.notFoundBody}</p>

          <div className="flex flex-wrap gap-3 pt-2">
            <Link
              to="/$locale/team"
              params={{ locale }}
              className="zine-btn bg-branch-accent text-branch-accent-contrast rounded-xl px-5 py-2.5 text-sm font-bold no-underline -rotate-1"
            >
              {dictionary.errors.goToTeam}
            </Link>
            <Link
              to="/$locale"
              params={{ locale }}
              className="zine-btn bg-paper text-ink rounded-xl px-5 py-2.5 text-sm font-bold no-underline rotate-1"
            >
              {dictionary.errors.goHome}
            </Link>
          </div>
        </div>
      </div>
    </BranchTheme>
  )
}
