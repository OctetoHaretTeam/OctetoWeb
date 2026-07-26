import { Link } from '@tanstack/react-router'

import { LanguageSwitch } from '@/components/language-switch'
import { SiteLogo } from '@/components/site-logo'
import { useDictionary, useLocale } from '@/i18n/use-locale'

/**
 * Site header — carries the mark, the wordmark and the language switcher,
 * which §11 requires to be visible on every viewport and never in a menu.
 *
 * Navigation links are still Phase 4's job.
 */
export function SiteHeader() {
  const locale = useLocale()
  const dictionary = useDictionary()

  return (
    <header className="border-branch-border bg-branch-ground border-b">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
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

        {/* Always visible, at every width. Not in a menu. */}
        <LanguageSwitch />
      </div>
    </header>
  )
}
