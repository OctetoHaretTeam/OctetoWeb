import { Link, createFileRoute } from '@tanstack/react-router'

import { adminScanStats } from '@/server/admin/misc'

/**
 * Admin dashboard — CLAUDE.md §10.
 *
 * Leads with QR scan statistics, because that is what the team will actually
 * open the panel for, and because they are the quotable evidence behind the
 * Connect Award: which printed surface actually brings people to the site.
 *
 * Everything shown is an aggregate. The underlying rows hold only a code, a
 * timestamp and a coarse country (§6) — there is no personal data here to
 * aggregate over.
 */
export const Route = createFileRoute('/admin/_authed/')({
  loader: () => adminScanStats(),
  component: Dashboard,
})

const SECTIONS = [
  { to: '/admin/team', label: 'Echipă', note: 'Roster, ordine, consimțământ' },
  { to: '/admin/news', label: 'Noutăți', note: 'Ciorne și publicare' },
  { to: '/admin/performance', label: 'Realizări', note: 'Tehnic și non-tehnic' },
  { to: '/admin/seasons', label: 'Sezoane', note: 'Arhiva și sezonul curent' },
  { to: '/admin/awards', label: 'Premii', note: 'Legate de sezoane' },
  { to: '/admin/sponsors', label: 'Sponsori', note: 'Zidul sponsorilor' },
  { to: '/admin/home-slides', label: 'Slide-uri acasă', note: 'Capul paginii' },
  { to: '/admin/info', label: 'Informații', note: 'Despre și contacte' },
  { to: '/admin/qr-codes', label: 'Coduri QR', note: 'Coduri pentru tipar' },
] as const

function Dashboard() {
  const stats = Route.useLoaderData()

  return (
    <div className="space-y-8">
      <section className="space-y-4">
        <div>
          <h2 className="text-xl font-semibold">Scanări QR</h2>
          <p className="text-muted-foreground text-sm">
            Ce anume aduce oameni pe site. Se înregistrează doar codul, momentul
            și țara — fără adrese IP și fără identificatori.
          </p>
        </div>

        <dl className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          <Stat label="Total scanări" value={stats.total} />
          <Stat label="Ultimele 30 de zile" value={stats.last30Days} />
          <Stat label="Țări distincte" value={stats.distinctCountries} />
        </dl>

        {stats.total === 0 ? (
          <div className="border-border rounded-md border border-dashed p-6">
            <p className="font-medium">Încă nicio scanare</p>
            <p className="text-muted-foreground mt-1 text-sm">
              Cifrele apar de îndată ce cineva scanează un cod tipărit.
            </p>
          </div>
        ) : null}

        <div className="grid gap-6 lg:grid-cols-2">
          <div className="space-y-2">
            <h3 className="text-sm font-semibold">După cod</h3>
            <ul className="space-y-1">
              {stats.byCode.map((row) => (
                <li
                  key={row.code}
                  className="border-border flex items-center justify-between gap-3 border-b py-1.5 text-sm"
                >
                  <span>
                    <span className="font-mono text-2xs uppercase">
                      {row.code}
                    </span>{' '}
                    <span className="text-muted-foreground">{row.label}</span>
                  </span>
                  <span className="font-semibold">{row.n}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="space-y-2">
            <h3 className="text-sm font-semibold">După țară</h3>
            {stats.byCountry.length === 0 ? (
              <p className="text-muted-foreground text-sm">—</p>
            ) : (
              <ul className="space-y-1">
                {stats.byCountry.map((row) => (
                  <li
                    key={row.country ?? 'unknown'}
                    className="border-border flex items-center justify-between gap-3 border-b py-1.5 text-sm"
                  >
                    <span className="font-mono text-2xs uppercase">
                      {row.country ?? 'necunoscut'}
                    </span>
                    <span className="font-semibold">{row.n}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold">Secțiuni</h2>
        <ul className="grid gap-2 sm:grid-cols-3">
          {SECTIONS.map((item) => (
            <li key={item.to}>
              <Link
                to={item.to}
                className="border-border hover:bg-accent block rounded-md border px-3 py-4 no-underline"
              >
                <span className="block font-medium">{item.label}</span>
                <span className="text-muted-foreground block text-xs">
                  {item.note}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <dd className="text-3xl font-semibold">{value}</dd>
      <dt className="text-muted-foreground font-mono text-2xs uppercase">
        {label}
      </dt>
    </div>
  )
}
