import { createFileRoute } from '@tanstack/react-router'

import { BranchSection } from '@/components/styleguide/branch-section'
import { ContrastSection } from '@/components/styleguide/contrast-section'
import { CutoutSection } from '@/components/styleguide/cutout-section'
import { I18nSection } from '@/components/styleguide/i18n-section'
import { PaletteSection } from '@/components/styleguide/palette-section'
import { TypeSection } from '@/components/styleguide/type-section'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

/**
 * Internal review page for the design system (CLAUDE.md §7).
 *
 * Not locale-prefixed: it is a team tool, not public content, so it sits
 * outside the §11 routing scheme alongside /admin. Worth gating or removing
 * before launch.
 */
export const Route = createFileRoute('/styleguide')({
  head: () => ({
    meta: [
      { title: 'Ghid de stil — OctetoHaret' },
      { name: 'robots', content: 'noindex, nofollow' },
    ],
  }),
  component: Styleguide,
})

function Styleguide() {
  return (
    <main className="bg-background text-foreground min-h-screen">
      <div className="mx-auto w-full max-w-6xl space-y-14 px-4 py-10 sm:px-6">
        <header className="space-y-3">
          <p className="font-mono text-2xs uppercase text-branch-muted">
            OctetoHaret · FTC 25474
          </p>
          <h1 className="text-4xl font-semibold">Ghid de stil</h1>
          <p className="text-branch-muted max-w-measure text-base">
            Sistemul de design înainte de orice pagină. Toate rapoartele de
            contrast de mai jos sunt calculate în pagină din valorile reale ale
            paletei.
          </p>
        </header>

        <Alert>
          <AlertTitle>Culorile nu sunt finale</AlertTitle>
          <AlertDescription>
            Hexurile din <code>theme.css</code> sunt estimate din capturi de pe
            Instagram. Trebuie înlocuite cu valorile exacte din fișierul SVG al
            logoului înainte de lansare.
          </AlertDescription>
        </Alert>

        <PaletteSection />
        <ContrastSection />
        <TypeSection />
        <BranchSection />
        <CutoutSection />
        <I18nSection />

        <section aria-labelledby="states-heading" className="space-y-4">
          <h2 id="states-heading" className="text-2xl font-semibold">
            Stări
          </h2>
          <Tabs defaultValue="loading">
            <TabsList>
              <TabsTrigger value="loading">Încărcare</TabsTrigger>
              <TabsTrigger value="empty">Gol</TabsTrigger>
              <TabsTrigger value="focus">Focus</TabsTrigger>
            </TabsList>

            <TabsContent value="loading" className="pt-4">
              <div className="space-y-3">
                <Skeleton className="h-6 w-48" />
                <Skeleton className="h-4 w-full max-w-measure" />
                <Skeleton className="h-4 w-2/3" />
              </div>
            </TabsContent>

            <TabsContent value="empty" className="pt-4">
              <div className="border-branch-border max-w-measure space-y-2 rounded-md border border-dashed p-6">
                <p className="font-semibold">Încă nimic aici</p>
                <p className="text-branch-muted text-sm">
                  Stările goale sunt o invitație la acțiune, nu o scuză
                  (CLAUDE.md §13).
                </p>
              </div>
            </TabsContent>

            <TabsContent value="focus" className="pt-4">
              <div className="space-y-3">
                <p className="text-branch-muted max-w-measure text-sm">
                  Inelul de focus are două tonuri, pentru că nicio culoare
                  singură nu trece de 3:1 pe toate fundalurile site-ului.
                  Navighează cu Tab prin exemplele de mai jos.
                </p>
                <div className="flex flex-wrap gap-3">
                  <a href="#states-heading" className="underline">
                    O legătură
                  </a>
                  <button type="button" className="border-branch-border rounded border px-3 py-1">
                    Un buton
                  </button>
                  <input
                    aria-label="Exemplu de câmp"
                    className="border-branch-border rounded border px-3 py-1"
                    placeholder="Un câmp"
                  />
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </section>
      </div>
    </main>
  )
}
