import { DICTIONARIES } from '@/i18n/dictionaries'
import {
  LOCALES,
  LOCALE_LABELS,
  type Locale,
  localeFromPathname,
  withLocale,
} from '@/i18n/locale'
import { useCurrentPath, useDictionary } from '@/i18n/use-locale'
import { cn } from '@/lib/utils'

/**
 * The RO / EN switcher — CLAUDE.md §11.
 *
 * Deliberate choices, each of which is a requirement rather than a preference:
 *
 * - **Real `<a>` elements, not TanStack `Link` and not an onClick handler.**
 *   On congested venue wifi this is often the first thing a judge taps, and it
 *   has to work before hydration or with JavaScript off entirely. A full
 *   navigation also lets the server re-read the URL and persist the `locale`
 *   cookie, which a client-side transition would not do.
 * - **It links to the equivalent page**, so `/ro/team/andrei` goes to
 *   `/en/team/andrei` and never to the home page. The query string is carried
 *   across too.
 * - **Text labels, never flags.** Romanian is spoken in both Moldova and
 *   Romania, and English has no single country — a flag would be both wrong
 *   and politically clumsy.
 * - **Both options are always rendered.** One tap, no dropdown, and the
 *   inactive option is a link rather than a hidden menu item.
 */
export function LanguageSwitch({ className }: { className?: string }) {
  const { pathname, search } = useCurrentPath()
  const dictionary = useDictionary()

  // Null on routes that are deliberately not locale-prefixed — /q/, /admin/
  // and /styleguide (§11). Those have no localised equivalent, so prefixing
  // the current path would produce a link to a page that does not exist.
  const current = localeFromPathname(pathname)

  const hrefFor = (locale: Locale) =>
    current === null
      ? `/${locale}`
      : `${withLocale(pathname, locale)}${search}`

  return (
    <nav
      aria-label={dictionary.language.label}
      className={cn(
        'border-branch-border inline-flex items-center rounded-full border p-0.5',
        className,
      )}
    >
      {LOCALES.map((locale) => {
        const isActive = locale === current
        // Each option is labelled in the language it switches to, which is what
        // a screen reader user needs to hear before following it.
        const label = isActive
          ? `${DICTIONARIES[locale].language.current}: ${LOCALE_LABELS[locale]}`
          : DICTIONARIES[locale].language.switchTo

        return (
          <a
            key={locale}
            href={hrefFor(locale)}
            hrefLang={locale}
            lang={locale}
            aria-label={label}
            aria-current={isActive ? 'true' : undefined}
            className={cn(
              'rounded-full px-2.5 py-1 text-2xs font-mono font-semibold uppercase no-underline transition-colors',
              isActive
                ? 'bg-branch-accent text-branch-accent-contrast'
                : 'text-branch-muted hover:text-branch-text',
            )}
          >
            {LOCALE_LABELS[locale]}
          </a>
        )
      })}
    </nav>
  )
}
