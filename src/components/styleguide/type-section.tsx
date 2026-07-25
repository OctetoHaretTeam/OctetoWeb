/**
 * Class names are written out in full rather than built as `text-${token}`.
 * Tailwind v4 finds utilities by scanning source text, so an interpolated
 * class name is never generated and the row would silently render at the
 * inherited size.
 */
const SCALE = [
  { token: '5xl', className: 'text-5xl', use: 'Hero, desktop' },
  { token: '4xl', className: 'text-4xl', use: 'Hero, mobil' },
  { token: '3xl', className: 'text-3xl', use: 'Titlu de pagină' },
  { token: '2xl', className: 'text-2xl', use: 'Titlu de secțiune' },
  { token: 'xl', className: 'text-xl', use: 'Titlu de card' },
  { token: 'lg', className: 'text-lg', use: 'Paragraf introductiv' },
  { token: 'base', className: 'text-base', use: 'Text curent' },
  { token: 'sm', className: 'text-sm', use: 'Text secundar' },
  { token: 'xs', className: 'text-xs', use: 'Legende, metadate' },
  { token: '2xs', className: 'text-2xs', use: 'Micro-etichete mono' },
] as const

const FAMILIES = [
  {
    name: 'Archivo',
    role: 'Display',
    className: 'font-display',
    note: 'Doar axa de greutate. Axa de lățime costă 106 KB în plus.',
  },
  {
    name: 'Instrument Sans',
    role: 'Text curent',
    className: 'font-body',
    note: 'Sans humanist. Fundația site-ului.',
  },
  {
    name: 'Martian Mono',
    role: 'Utilitar',
    className: 'font-mono',
    note: 'Specificații, metrici, etichete tehnice.',
  },
] as const

const SPECIMEN = 'Chișinău — ăâîșț — OctetoHaret 25474'

export function TypeSection() {
  return (
    <section aria-labelledby="type-heading" className="space-y-8">
      <header className="space-y-2">
        <h2 id="type-heading" className="text-2xl font-semibold">
          Tipografie
        </h2>
        <p className="text-branch-muted max-w-measure text-sm">
          Trei familii, găzduite local prin Fontsource. Fără cerere către
          Google Fonts. Specimenul include diacriticele românești, care sunt în
          subsetul latin-ext.
        </p>
      </header>

      <div className="space-y-6">
        {FAMILIES.map((family) => (
          <div key={family.name} className="space-y-2">
            <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <h3 className="text-lg font-semibold">{family.name}</h3>
              <span className="font-mono text-2xs uppercase text-branch-muted">
                {family.role}
              </span>
            </div>
            <p className={`${family.className} text-xl`}>{SPECIMEN}</p>
            <p className="text-branch-muted text-xs">{family.note}</p>
          </div>
        ))}
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Scară</h3>
        <ul className="space-y-4">
          {SCALE.map(({ token, className, use }) => (
            <li
              key={token}
              className="border-branch-border flex flex-col gap-1 border-b pb-4 last:border-b-0"
            >
              <div className="flex flex-wrap items-baseline gap-x-3">
                <span className="font-mono text-2xs uppercase">
                  text-{token}
                </span>
                <span className="text-branch-muted text-xs">{use}</span>
              </div>
              <span className={`${className} block truncate`}>
                Echipa OctetoHaret
              </span>
            </li>
          ))}
        </ul>
      </div>

      <div className="space-y-3">
        <h3 className="text-lg font-semibold">Greutăți</h3>
        <ul className="space-y-1">
          {(
            [
              ['normal', 'font-normal'],
              ['medium', 'font-medium'],
              ['semibold', 'font-semibold'],
              ['bold', 'font-bold'],
              ['black', 'font-black'],
            ] as const
          ).map(([name, className]) => (
            <li key={name} className="flex items-baseline gap-3">
              <span className="font-mono text-2xs w-24 uppercase">{name}</span>
              <span className={`${className} text-lg`}>Connect Award</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
