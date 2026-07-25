import { useState } from 'react'
import { createFileRoute, notFound, useNavigate } from '@tanstack/react-router'

import {
  SponsorForm,
  type SponsorFormValues,
  type toSponsorSubmitValues,
} from '@/components/admin/sponsor-form'
import {
  adminGetSponsor,
  adminListSeasonSlugs,
  adminUpdateSponsor,
} from '@/server/admin/sponsors'

export const Route = createFileRoute('/admin/_authed/sponsors/$id')({
  loader: async ({ params }) => {
    const [sponsor, seasons] = await Promise.all([
      adminGetSponsor({ data: { id: params.id } }),
      adminListSeasonSlugs(),
    ])
    if (!sponsor) throw notFound()
    return { sponsor, seasons }
  },
  component: EditSponsor,
  notFoundComponent: () => (
    <p className="text-muted-foreground">Sponsorul nu a fost găsit.</p>
  ),
})

function EditSponsor() {
  const { sponsor, seasons } = Route.useLoaderData()
  const navigate = useNavigate()
  const [error, setError] = useState<string | null>(null)

  const initial: SponsorFormValues = {
    name: sponsor.name,
    logo: sponsor.logo,
    logoDark: sponsor.logoDark,
    descriptionRo: sponsor.descriptionRo ?? '',
    descriptionEn: sponsor.descriptionEn ?? '',
    websiteUrl: sponsor.websiteUrl ?? '',
    tier: sponsor.tier ?? 'none',
    activeSeasons: sponsor.activeSeasons,
    displayOrder: String(sponsor.displayOrder),
  }

  async function handleSubmit(
    values: ReturnType<typeof toSponsorSubmitValues>,
  ) {
    setError(null)
    const result = await adminUpdateSponsor({
      data: { id: sponsor.id, values },
    })

    if (!result.ok) {
      setError('Sponsorul nu a putut fi salvat.')
      throw new Error('save-failed')
    }

    await navigate({ to: '/admin/sponsors' })
  }

  return (
    <div className="space-y-5">
      <h2 className="text-xl font-semibold">{sponsor.name}</h2>

      <SponsorForm
        draftKey={`sponsor:${sponsor.id}`}
        initialValues={initial}
        seasons={seasons}
        submitLabel="Salvează"
        serverError={error}
        onSubmit={handleSubmit}
      />
    </div>
  )
}
