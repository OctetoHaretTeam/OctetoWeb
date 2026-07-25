import { contrastRatio, formatRatio } from '@/lib/contrast'
import { BRAND_PALETTE, GROUND_TOKENS, type BrandToken } from '@/lib/palette'

const FOREGROUNDS: BrandToken[] = [
  'paper',
  'ink',
  'carbon',
  'slate',
  'sage',
  'signal',
  'gold',
  'violet',
]

function verdict(ratio: number): { label: string; tone: string } {
  if (ratio >= 7) return { label: 'AAA', tone: 'text-signal' }
  if (ratio >= 4.5) return { label: 'AA', tone: 'text-signal' }
  if (ratio >= 3) return { label: 'AA mare / UI', tone: 'text-gold' }
  return { label: 'picat', tone: 'text-branch-muted' }
}

/**
 * Every pairing, measured. Kept as a full matrix rather than a curated list so
 * a failing combination cannot hide by simply not being listed.
 */
export function ContrastSection() {
  return (
    <section aria-labelledby="contrast-heading" className="space-y-4">
      <header className="space-y-2">
        <h2 id="contrast-heading" className="text-2xl font-semibold">
          Matrice de contrast
        </h2>
        <p className="text-branch-muted max-w-measure text-sm">
          WCAG 2.1. Textul normal are nevoie de 4.5:1, textul mare și
          elementele de interfață de 3:1. Celulele goale sunt aceeași culoare
          pe ea însăși.
        </p>
      </header>

      <div className="border-branch-border overflow-x-auto rounded-md border">
        <table className="w-full min-w-[34rem] border-collapse text-left">
          <caption className="sr-only">
            Rapoarte de contrast între fiecare culoare de prim-plan și fiecare
            fundal
          </caption>
          <thead>
            <tr>
              <th
                scope="col"
                className="border-branch-border border-b px-3 py-2 font-mono text-2xs uppercase"
              >
                prim-plan
              </th>
              {GROUND_TOKENS.map((ground) => (
                <th
                  key={ground}
                  scope="col"
                  className="border-branch-border border-b px-3 py-2 font-mono text-2xs uppercase"
                >
                  {ground}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {FOREGROUNDS.map((fg) => (
              <tr key={fg}>
                <th
                  scope="row"
                  className="border-branch-border border-b px-3 py-2 font-mono text-2xs uppercase"
                >
                  {fg}
                </th>
                {GROUND_TOKENS.map((ground) => {
                  if (fg === ground) {
                    return (
                      <td
                        key={ground}
                        className="border-branch-border text-branch-muted border-b px-3 py-2"
                      >
                        —
                      </td>
                    )
                  }
                  const ratio = contrastRatio(
                    BRAND_PALETTE[fg],
                    BRAND_PALETTE[ground],
                  )
                  const { label, tone } = verdict(ratio)
                  return (
                    <td
                      key={ground}
                      className="border-branch-border border-b px-3 py-2 align-top"
                    >
                      <span className="block font-mono text-2xs">
                        {formatRatio(ratio)}
                      </span>
                      <span className={`block text-2xs ${tone}`}>{label}</span>
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}
