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
  { to: '/$locale/performance', key: 'performance', tilt: 'hover:-rotate-2' },
  { to: '/$locale/team', key: 'team', tilt: 'hover:rotate-2' },
  { to: '/$locale/news', key: 'news', tilt: 'hover:-rotate-1' },
  { to: '/$locale/seasons', key: 'seasons', tilt: 'hover:rotate-1' },
  { to: '/$locale/sponsors', key: 'sponsors', tilt: 'hover:-rotate-2' },
  { to: '/$locale/about', key: 'about', tilt: 'hover:rotate-2' },
] as const

export function SiteHeader() {
  const locale = useLocale()
  const dictionary = useDictionary()

  return (
    <header
      data-branch="tech"
      className="border-branch-border bg-branch-ground relative border-b-2 border-dashed lg:sticky lg:top-0 lg:z-50"
    >
      <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">
        <div className="flex items-center justify-between gap-4 py-3">
          <div className="flex items-center gap-3">
            <Link
              to="/$locale"
              params={{ locale }}
              className="group flex items-center gap-2.5 no-underline"
            >
              <SiteLogo className="transition-transform duration-200 group-hover:-rotate-6 group-hover:scale-105" />
              <span className="flex flex-col leading-tight">
                <span className="font-display text-branch-text text-xl font-black tracking-tight transition-transform group-hover:rotate-1">
                  {dictionary.site.name}
                </span>
                <span className="text-branch-muted font-mono text-2xs">
                  {dictionary.site.teamNumber}
                </span>
              </span>
            </Link>
          </div>

          <div className="flex items-center gap-3">
            <SectionNav
              locale={locale}
              dictionary={dictionary}
              className="hidden sm:flex"
            />
            <LanguageSwitch />
          </div>
        </div>

        <SectionNav
          locale={locale}
          dictionary={dictionary}
          className="-mx-4 flex flex-nowrap px-4 py-2 sm:hidden"
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
      className={`items-center gap-1.5 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden ${className}`}
    >
      {NAV.map((item) => (
        <Link
          key={item.to}
          to={item.to}
          params={{ locale }}
          className={`font-display text-branch-muted hover:text-branch-text data-[status=active]:text-ink data-[status=active]:bg-signal rounded-full px-3 py-1.5 text-sm font-bold whitespace-nowrap no-underline transition-all duration-150 ${item.tilt} data-[status=active]:-rotate-1 data-[status=active]:shadow-[2px_3px_0_var(--color-paper)]`}
        >
          {dictionary.nav[item.key]}
        </Link>
      ))}
    </nav>
  )
}
