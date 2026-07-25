import { BranchTheme } from '@/components/branch-theme'
import { PaperCutout } from '@/components/paper-cutout'

/**
 * Seeds are deliberately member-slug shaped. The point of this section is to
 * show that the tear differs per seed and is stable per seed — if these all
 * looked alike it would read as a stamped filter, which §7.4 rules out.
 */
const SEEDS = [
  'placeholder-tech',
  'placeholder-non-tech',
  'placeholder-mentor',
  'placeholder-volunteer',
  'pit',
  'robot',
]

export function CutoutSection() {
  return (
    <section aria-labelledby="cutout-heading" className="space-y-6">
      <header className="space-y-2">
        <h2 id="cutout-heading" className="text-2xl font-semibold">
          PaperCutout
        </h2>
        <p className="text-branch-muted max-w-measure text-sm">
          Elementul semnătură. Marginea e generată din proprietatea{' '}
          <code className="font-mono text-2xs">seed</code> — slug-ul membrului
          — deci fiecare persoană are o ruptură diferită, aceeași la fiecare
          randare. Se folosește pe cardurile echipei, pe profiluri și pe
          copertele non-tehnice. Nicăieri altundeva.
        </p>
      </header>

      <BranchTheme
        branch="non_tech"
        className="rounded-lg p-6"
        aria-label="Decupaje pe pânza non-tehnică"
      >
        <ul className="grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-6">
          {SEEDS.map((seed) => (
            <li key={seed} className="space-y-2">
              <PaperCutout seed={seed} className="aspect-square w-full">
                {/* Stands in for a member photograph. No real photo is used:
                    photoConsent defaults to false (§8). */}
                <div className="bg-branch-ground h-full w-full" />
              </PaperCutout>
              <p className="font-mono text-2xs truncate text-center">{seed}</p>
            </li>
          ))}
        </ul>
      </BranchTheme>

      <div className="space-y-3">
        <h3 className="text-lg font-semibold">Reglaje</h3>
        <BranchTheme branch="non_tech" className="rounded-lg p-6">
          <ul className="grid grid-cols-2 gap-5 sm:grid-cols-4">
            {(
              [
                { label: 'implicit', props: {} },
                { label: 'roughness 0.4', props: { roughness: 0.4 } },
                { label: 'roughness 1.8', props: { roughness: 1.8 } },
                { label: 'edge 0.12', props: { edge: 0.12 } },
              ] as const
            ).map(({ label, props }) => (
              <li key={label} className="space-y-2">
                <PaperCutout
                  seed="placeholder-tech"
                  className="aspect-square w-full"
                  {...props}
                >
                  <div className="bg-branch-ground h-full w-full" />
                </PaperCutout>
                <p className="font-mono text-2xs text-center">{label}</p>
              </li>
            ))}
          </ul>
        </BranchTheme>
      </div>
    </section>
  )
}
