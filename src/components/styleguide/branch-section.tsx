import { BranchTheme } from '@/components/branch-theme'
import { PaperCutout } from '@/components/paper-cutout'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { BRANCHES, type Branch } from '@/lib/branch'
import { BRANCH_TREATMENTS } from '@/lib/palette'

/**
 * One component tree, rendered once per branch. Nothing below takes a
 * `variant` prop — the difference comes entirely from the `data-branch`
 * attribute that `BranchTheme` sets (CLAUDE.md §7.3).
 */
function BranchDemo({ branch }: { branch: Branch }) {
  const treatment = BRANCH_TREATMENTS[branch]

  return (
    <BranchTheme
      branch={branch}
      className="border-branch-border space-y-6 rounded-lg border p-5"
    >
      <header className="space-y-1">
        <p className="branch-label">{treatment.label}</p>
        <h3 className="text-2xl font-semibold">Ce vezi aici</h3>
        <p className="text-branch-muted max-w-measure text-sm">
          {treatment.type}. Fundal <code>{treatment.ground}</code>, text{' '}
          <code>{treatment.text}</code>, accent{' '}
          <code>{treatment.accent}</code>.
        </p>
      </header>

      <Separator />

      <div className="flex flex-wrap items-center gap-2">
        <Button>Acțiune principală</Button>
        <Button variant="secondary">Secundar</Button>
        <Button variant="outline">Contur</Button>
        <Button variant="ghost">Discret</Button>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Badge>Insignă</Badge>
        <Badge variant="secondary">Secundară</Badge>
        <Badge variant="outline">Contur</Badge>
      </div>

      <div className="bg-branch-surface space-y-3 rounded-md p-4">
        <p className="branch-label">Suprafață ridicată</p>
        <div className="space-y-2">
          <Label htmlFor={`name-${branch}`}>Nume</Label>
          <Input id={`name-${branch}`} placeholder="Scrie un nume" />
        </div>
        <div className="space-y-2">
          <Label htmlFor={`note-${branch}`}>Descriere</Label>
          <Textarea id={`note-${branch}`} placeholder="Câteva rânduri" />
        </div>
        <div className="flex items-center gap-2">
          <Checkbox id={`consent-${branch}`} />
          <Label htmlFor={`consent-${branch}`}>Acord pentru fotografie</Label>
        </div>
        <div className="flex items-center gap-2">
          <Switch id={`active-${branch}`} />
          <Label htmlFor={`active-${branch}`}>Membru activ</Label>
        </div>
      </div>

      <div className="space-y-2">
        <p className="branch-label">Accent ca umplere</p>
        <p className="text-branch-muted max-w-measure text-sm">
          Accentul este o umplere, niciodată o culoare de text. Pe pânza sage,{' '}
          <code>gold</code> ca text dă 1.69:1; ca umplere cu text{' '}
          <code>ink</code> dă 9.03:1.
        </p>
        <span className="bg-branch-accent text-branch-accent-contrast inline-block rounded px-2 py-1 text-sm font-semibold">
          Connect Award
        </span>
      </div>

      {branch === 'non_tech' ? (
        <div className="space-y-2">
          <p className="branch-label">Decupaj pe pânză</p>
          <PaperCutout seed={`demo-${branch}`} className="aspect-square w-32">
            <div className="bg-branch-ground h-full w-full" />
          </PaperCutout>
        </div>
      ) : null}
    </BranchTheme>
  )
}

export function BranchSection() {
  return (
    <section aria-labelledby="branch-heading" className="space-y-4">
      <header className="space-y-2">
        <h2 id="branch-heading" className="text-2xl font-semibold">
          Cele două ramuri
        </h2>
        <p className="text-branch-muted max-w-measure text-sm">
          Același arbore de componente, redat de două ori. Nicio componentă nu
          primește o proprietate de variantă — diferența vine din atributul{' '}
          <code className="font-mono text-2xs">data-branch</code>.
        </p>
      </header>

      <div className="grid gap-5 lg:grid-cols-2">
        {BRANCHES.map((branch) => (
          <BranchDemo key={branch} branch={branch} />
        ))}
      </div>
    </section>
  )
}
