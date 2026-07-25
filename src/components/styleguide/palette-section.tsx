import { contrastRatio, formatRatio } from '@/lib/contrast'
import {
  BRAND_PALETTE,
  GROUND_TOKENS,
  PALETTE_ROLES,
  type BrandToken,
} from '@/lib/palette'

export function PaletteSection() {
  const tokens = Object.keys(BRAND_PALETTE) as BrandToken[]

  return (
    <section aria-labelledby="palette-heading" className="space-y-6">
      <header className="space-y-2">
        <h2 id="palette-heading" className="text-2xl font-semibold">
          Paletă
        </h2>
        <p className="text-branch-muted max-w-measure text-sm">
          Definită în <code className="font-mono text-2xs">theme.css</code>.
          Valorile sunt estimate din capturi Instagram și trebuie înlocuite cu
          cele exacte din fișierul SVG al logoului.
        </p>
      </header>

      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {tokens.map((token) => (
          <li
            key={token}
            className="border-branch-border overflow-hidden rounded-md border"
          >
            <div
              className="h-16 w-full"
              style={{ backgroundColor: BRAND_PALETTE[token] }}
            />
            <div className="space-y-1 p-3">
              <p className="font-mono text-2xs uppercase">--{token}</p>
              <p className="font-mono text-2xs text-branch-muted">
                {BRAND_PALETTE[token]}
              </p>
              <p className="text-branch-muted text-xs">
                {PALETTE_ROLES[token]}
              </p>
            </div>
          </li>
        ))}
      </ul>

      <div className="space-y-3">
        <h3 className="text-lg font-semibold">Text pe fundaluri</h3>
        <p className="text-branch-muted max-w-measure text-sm">
          Fiecare raport este calculat în pagină. Când se schimbă un hex, acest
          tabel se recalculează.
        </p>
        <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {GROUND_TOKENS.flatMap((ground) =>
            (['paper', 'ink', 'signal', 'gold'] as BrandToken[])
              .filter((fg) => fg !== ground)
              .map((fg) => {
                const ratio = contrastRatio(
                  BRAND_PALETTE[fg],
                  BRAND_PALETTE[ground],
                )
                const ok = ratio >= 4.5
                return (
                  <li
                    key={`${fg}-${ground}`}
                    className="flex items-center justify-between gap-3 rounded-md px-3 py-2"
                    style={{ backgroundColor: BRAND_PALETTE[ground] }}
                  >
                    <span
                      className="text-sm"
                      style={{ color: BRAND_PALETTE[fg] }}
                    >
                      {fg} pe {ground}
                    </span>
                    <span
                      className="font-mono text-2xs whitespace-nowrap"
                      style={{ color: BRAND_PALETTE[fg] }}
                    >
                      {formatRatio(ratio)} {ok ? 'AA' : '✕'}
                    </span>
                  </li>
                )
              }),
          )}
        </ul>
      </div>
    </section>
  )
}
