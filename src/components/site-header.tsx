import { Link } from '@tanstack/react-router'

import { LanguageSwitch } from '@/components/language-switch'
import { useDictionary, useLocale } from '@/i18n/use-locale'

/**
 * Minimal site header — enough to carry the language switcher, which §11
 * requires to be visible in the header on every viewport including mobile, and
 * never hidden inside a menu.
 *
 * Navigation links are Phase 4's job; this exists so the switcher has a home
 * and can be exercised.
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
          className="flex flex-col leading-tight no-underline"
        >
          <span className="text-branch-text text-lg font-semibold tracking-tight">
            {dictionary.site.name}
          </span>
          <span className="text-branch-muted font-mono text-2xs uppercase">
            {dictionary.site.teamNumber}
          </span>
        </Link>

        {/* Always visible, at every width. Not in a menu. */}
        <LanguageSwitch />
      </div>
    </header>
  )
}
