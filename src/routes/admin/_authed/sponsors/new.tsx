import { useState } from 'react'
import { createFileRoute, useNavigate } from '@tanstack/react-router'

import {
  SponsorForm,
  emptySponsorForm,
  type toSponsorSubmitValues,
} from '@/components/admin/sponsor-form'
import {
  adminCreateSponsor,
  adminListSeasonSlugs,
  adminNextSponsorOrder,
} from '@/server/admin/sponsors'

export const Route = createFileRoute('/admin/_authed/sponsors/new')({
  loader: async () => {
    const [seasons, nextOrder] = await Promise.all([
      adminListSeasonSlugs(),
      adminNextSponsorOrder(),
    ])
    return { seasons, nextOrder }
  },
  component: NewSponsor,
})

function NewSponsor() {
  const { seasons, nextOrder } = Route.useLoaderData()
  const navigate = useNavigate()
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(
    values: ReturnType<typeof toSponsorSubmitValues>,
  ) {
    setError(null)
    const result = await adminCreateSponsor({ data: values })

    if (!result.ok) {
      setError('Sponsorul nu a putut fi salvat.')
      throw new Error('save-failed')
    }

    await navigate({ to: '/admin/sponsors' })
  }

  return (
    <div className="space-y-5">
      <h2 className="text-xl font-semibold">Sponsor nou</h2>

      <SponsorForm
        draftKey="sponsor:new"
        initialValues={emptySponsorForm(nextOrder)}
        seasons={seasons}
        submitLabel="Adaugă sponsor"
        serverError={error}
        onSubmit={handleSubmit}
      />
    </div>
  )
}
