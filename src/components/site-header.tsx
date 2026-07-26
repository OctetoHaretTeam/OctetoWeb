import { Link } from '@tanstack/react-router'

import { LanguageSwitch } from '@/components/language-switch'
import { SiteLogo } from '@/components/site-logo'
import { useDictionary, useLocale } from '@/i18n/use-locale'

/**
 * Site header — CLAUDE.md §11.
 *
 * The mark, the wordmark, the sections and the language switcher.
 *
 * There is no hamburger. At 390px the sections become a horizontally
 * scrollable row on a second line: every section stays one tap away, whereas a
 * menu that must be opened first costs an extra tap on venue wifi (§2). The
 * language switcher stays on the top row at every width, because §11 requires
 * it to be visible and never hidden inside a menu.
 */
const NAV = [
  { to: '/$locale/performance', key: 'performance' },
  { to: '/$locale/team', key: 'team' },
  { to: '/$locale/news', key: 'news' },
  { to: '/$locale/seasons', key: 'seasons' },
  { to: '/$locale/sponsors', key: 'sponsors' },
  { to: '/$locale/about', key: 'about' },
] as const

export function SiteHeader() {
  const locale = useLocale()
  const dictionary = useDictionary()

  return (
    <header className="border-branch-border bg-branch-ground border-b">
      <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">
        <div className="flex items-center justify-between gap-4 py-3">
          <Link
            to="/$locale"
            params={{ locale }}
            className="flex items-center gap-2.5 no-underline"
          >
            <SiteLogo />
            <span className="flex flex-col leading-tight">
              <span className="text-branch-text text-lg font-semibold tracking-tight">
                {dictionary.site.name}
              </span>
              <span className="text-branch-muted font-mono text-2xs uppercase">
                {dictionary.site.teamNumber}
              </span>
            </span>
          </Link>

          <div className="flex items-center gap-3">
            {/* Inline once there is room for it. */}
            <SectionNav
              locale={locale}
              dictionary={dictionary}
              className="hidden sm:flex"
            />
            <LanguageSwitch />
          </div>
        </div>

        {/* Second row below sm, scrollable rather than collapsed. */}
        <SectionNav
          locale={locale}
          dictionary={dictionary}
          className="-mx-4 flex px-4 pb-2 sm:hidden"
        />
      </div>
    </header>
  )
}

function SectionNav({
  locale,
  dictionary,
  className,
}: {
  locale: ReturnType<typeof useLocale>
  dictionary: ReturnType<typeof useDictionary>
  className: string
}) {
  return (
    <nav
      aria-label={dictionary.nav.home}
      className={`items-center gap-1 overflow-x-auto ${className}`}
    >
      {NAV.map((item) => (
        <Link
          key={item.to}
          to={item.to}
          params={{ locale }}
          className="text-branch-muted hover:text-branch-text data-[status=active]:text-branch-text rounded px-2 py-1 text-sm whitespace-nowrap no-underline"
        >
          {dictionary.nav[item.key]}
        </Link>
      ))}
    </nav>
  )
}
