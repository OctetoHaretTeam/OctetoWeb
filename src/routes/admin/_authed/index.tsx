import { Link, createFileRoute } from '@tanstack/react-router'

/**
 * Admin dashboard — CLAUDE.md §10.
 *
 * §10 says the dashboard leads with QR scan statistics, because that is what
 * the team will actually open the panel for. Those need the §6 resolver to be
 * recording scans, which is not built yet — so the panel is honest about what
 * is ready instead of showing an empty chart.
 */
export const Route = createFileRoute('/admin/_authed/')({
  component: Dashboard,
})

const READY = [
  { to: '/admin/team', label: 'Echipă', note: 'Roster, ordine, consimțământ' },
  { to: '/admin/news', label: 'Noutăți', note: 'Ciorne și publicare' },
  { to: '/admin/qr-codes', label: 'Coduri QR', note: 'Coduri pentru tipar' },
] as const

const PENDING = [
  { label: 'Realizări', note: 'în lucru' },
  { label: 'Sezoane', note: 'în lucru' },
  { label: 'Premii', note: 'în lucru' },
  { label: 'Informații', note: 'în lucru' },
  { label: 'Sponsori', note: 'așteaptă încărcarea imaginilor' },
  { label: 'Slide-uri acasă', note: 'așteaptă încărcarea imaginilor' },
]

function Dashboard() {
  return (
    <div className="space-y-8">
      <div className="space-y-1">
        <h2 className="text-xl font-semibold">Panou</h2>
        <p className="text-muted-foreground text-sm">
          Statisticile scanărilor QR apar aici odată ce sistemul de redirecționare
          începe să înregistreze scanări.
        </p>
      </div>

      <section className="space-y-3">
        <h3 className="text-sm font-semibold">Gata de folosit</h3>
        <ul className="grid gap-2 sm:grid-cols-3">
          {READY.map((item) => (
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

      <section className="space-y-3">
        <h3 className="text-sm font-semibold">Încă nu</h3>
        <ul className="grid gap-2 sm:grid-cols-3">
          {PENDING.map((item) => (
            <li
              key={item.label}
              className="border-border text-muted-foreground rounded-md border border-dashed px-3 py-4 text-sm"
            >
              <span className="block">{item.label}</span>
              <span className="font-mono text-2xs uppercase">{item.note}</span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}
