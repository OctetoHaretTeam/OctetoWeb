import { createFileRoute } from '@tanstack/react-router'

/**
 * Admin dashboard — CLAUDE.md §10.
 *
 * §10 says the dashboard leads with QR scan stats, because that is what the
 * team will actually open the panel for. Those need the §6 QR system, which is
 * not built yet, so this is a placeholder shell.
 */
export const Route = createFileRoute('/admin/_authed/')({
  component: Dashboard,
})

const SECTIONS = [
  'Slide-uri acasă',
  'Noutăți',
  'Realizări',
  'Sezoane',
  'Premii',
  'Echipă',
  'Sponsori',
  'Informații',
  'Coduri QR',
]

function Dashboard() {
  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h2 className="text-xl font-semibold">Panou</h2>
        <p className="text-muted-foreground text-sm">
          Statisticile scanărilor QR vor apărea aici, odată ce sistemul QR este
          construit.
        </p>
      </div>

      <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {SECTIONS.map((section) => (
          <li
            key={section}
            className="border-border text-muted-foreground rounded-md border border-dashed px-3 py-4 text-sm"
          >
            {section}
            <span className="ml-2 font-mono text-2xs uppercase">în lucru</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
