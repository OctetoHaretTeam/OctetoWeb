import { useState } from 'react'

import { LanguageSwitch } from '@/components/language-switch'
import { LocalizedText } from '@/components/localized-text'
import { getDictionary } from '@/i18n/dictionaries'
import {
  formatCompact,
  formatCurrency,
  formatDate,
  formatNumber,
} from '@/i18n/format'
import { LOCALES, LOCALE_LABELS, type Locale } from '@/i18n/locale'

/**
 * Lets the language system be reviewed without leaving the styleguide.
 *
 * The toggle below is local preview state, not navigation — the real switcher
 * (rendered live further down) performs a full navigation, which is what makes
 * it work without JavaScript.
 */
export function I18nSection() {
  const [preview, setPreview] = useState<Locale>('ro')
  const dictionary = getDictionary(preview)

  const bothLanguages = { ro: 'Premiul Connect', en: 'Connect Award' }
  const romanianOnly = { ro: 'Vizită la o școală din Chișinău', en: null }
  const empty = { ro: null, en: null }

  return (
    <section aria-labelledby="i18n-heading" className="space-y-6">
      <header className="space-y-2">
        <h2 id="i18n-heading" className="text-2xl font-semibold">
          Limbă
        </h2>
        <p className="text-branch-muted max-w-measure text-sm">
          Româna este limba implicită; engleza este ce citesc jurații. Comută
          previzualizarea ca să vezi textul de rezervă în ambele stări.
        </p>
      </header>

      <div className="border-branch-border flex flex-wrap items-center gap-4 rounded-md border p-4">
        <div className="space-y-1">
          <p className="branch-label">Previzualizare</p>
          <div
            role="group"
            aria-label="Previzualizare limbă"
            className="border-branch-border inline-flex rounded-full border p-0.5"
          >
            {LOCALES.map((locale) => (
              <button
                key={locale}
                type="button"
                onClick={() => setPreview(locale)}
                aria-pressed={preview === locale}
                className={`rounded-full px-2.5 py-1 font-mono text-2xs font-semibold uppercase ${
                  preview === locale
                    ? 'bg-branch-accent text-branch-accent-contrast'
                    : 'text-branch-muted'
                }`}
              >
                {LOCALE_LABELS[locale]}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-1">
          <p className="branch-label">Comutatorul real</p>
          <LanguageSwitch />
          <p className="text-branch-muted text-xs">
            Legături reale, funcționează fără JavaScript.
          </p>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Regula de rezervă</h3>

        <div className="border-branch-border space-y-1 rounded-md border p-4">
          <p className="branch-label">Ambele limbi există</p>
          <LocalizedText field={bothLanguages} locale={preview} />
        </div>

        <div className="border-branch-border space-y-1 rounded-md border p-4">
          <p className="branch-label">Engleza lipsește</p>
          <LocalizedText field={romanianOnly} locale={preview} />
          <p className="text-branch-muted mt-2 text-xs">
            În engleză se afișează textul român plus nota. Nota nu apare în
            română, pentru că nu s-a produs nicio rezervă.
          </p>
        </div>

        <div className="border-branch-border space-y-1 rounded-md border p-4">
          <p className="branch-label">Ambele lipsesc</p>
          <LocalizedText
            field={empty}
            locale={preview}
            fallback={
              <p className="text-branch-muted text-sm italic">
                Nu se randează nimic — niciodată un bloc gol.
              </p>
            }
          />
        </div>
      </div>

      <div className="space-y-3">
        <h3 className="text-lg font-semibold">Formatare</h3>
        <dl className="grid gap-2 sm:grid-cols-2">
          {[
            ['Dată', formatDate('2026-02-21', preview)],
            ['Număr', formatNumber(12480, preview)],
            ['Compact', formatCompact(12480, preview)],
            ['Monedă (MDL)', formatCurrency(45000, preview)],
          ].map(([label, value]) => (
            <div
              key={label}
              className="border-branch-border flex items-baseline justify-between gap-3 rounded-md border px-3 py-2"
            >
              <dt className="branch-label">{label}</dt>
              <dd className="font-mono text-sm">{value}</dd>
            </div>
          ))}
        </dl>
      </div>

      <div className="space-y-2">
        <h3 className="text-lg font-semibold">Șiruri de interfață</h3>
        <p className="text-branch-muted max-w-measure text-sm">
          Din dicționarul <code className="font-mono text-2xs">{preview}</code>.
          Cheile sunt identice între limbi, deci una lipsă e o eroare de
          TypeScript, nu un buton gol.
        </p>
        <ul className="grid gap-1 sm:grid-cols-2">
          {[
            dictionary.actions.readMore,
            dictionary.actions.downloadPortfolio,
            dictionary.empty.news,
            dictionary.errors.notFoundTitle,
            dictionary.forms.invalidEmail,
            dictionary.team.noPhoto,
          ].map((value) => (
            <li key={value} className="text-sm">
              {value}
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
