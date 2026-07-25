import { useState } from 'react'
import { createFileRoute, useNavigate } from '@tanstack/react-router'

import {
  SeasonForm,
  emptySeasonForm,
  type toSeasonSubmitValues,
} from '@/components/admin/season-form'
import { adminCreateSeason, adminListSeasons } from '@/server/admin/seasons'

export const Route = createFileRoute('/admin/_authed/seasons/new')({
  loader: async () => (await adminListSeasons()).length,
  component: NewSeason,
})

function NewSeason() {
  const count = Route.useLoaderData()
  const navigate = useNavigate()
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(values: ReturnType<typeof toSeasonSubmitValues>) {
    setError(null)
    const result = await adminCreateSeason({ data: values })

    if (!result.ok) {
      setError(
        result.error === 'slug-taken'
          ? 'Slug-ul este deja folosit. Alege altul.'
          : 'Sezonul nu a putut fi salvat.',
      )
      throw new Error(result.error)
    }

    await navigate({ to: '/admin/seasons' })
  }

  return (
    <div className="space-y-5">
      <h2 className="text-xl font-semibold">Sezon nou</h2>

      <SeasonForm
        draftKey="season:new"
        initialValues={emptySeasonForm(count)}
        submitLabel="Adaugă sezon"
        serverError={error}
        onSubmit={handleSubmit}
      />
    </div>
  )
}
