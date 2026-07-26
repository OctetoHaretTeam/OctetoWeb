import { useState } from 'react'
import { createFileRoute, notFound, useNavigate } from '@tanstack/react-router'

import {
  SeasonForm,
  type SeasonFormValues,
  type toSeasonSubmitValues,
} from '@/components/admin/season-form'
import { adminGetSeason, adminUpdateSeason } from '@/server/admin/seasons'

export const Route = createFileRoute('/admin/_authed/seasons/$slug')({
  loader: async ({ params }) => {
    const season = await adminGetSeason({ data: { slug: params.slug } })
    if (!season) throw notFound()
    return season
  },
  component: EditSeason,
  notFoundComponent: () => (
    <p className="text-muted-foreground">Sezonul nu a fost găsit.</p>
  ),
})

function EditSeason() {
  const season = Route.useLoaderData()
  const navigate = useNavigate()
  const [error, setError] = useState<string | null>(null)

  const initial: SeasonFormValues = {
    slug: season.slug,
    name: season.name,
    gameName: season.gameName,
    startDate: season.startDate,
    endDate: season.endDate ?? '',
    descriptionRo: season.descriptionRo,
    descriptionEn: season.descriptionEn ?? '',
    coverImage: season.coverImage,
    gallery: season.gallery,
    portfolioUrl: season.portfolioUrl ?? '',
    isCurrent: season.isCurrent,
    displayOrder: String(season.displayOrder),
  }

  async function handleSubmit(values: ReturnType<typeof toSeasonSubmitValues>) {
    setError(null)
    const result = await adminUpdateSeason({
      data: { currentSlug: season.slug, values },
    })

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
      <h2 className="text-xl font-semibold">{season.name}</h2>

      <SeasonForm
        draftKey={`season:${season.slug}`}
        initialValues={initial}
        submitLabel="Salvează"
        serverError={error}
        onSubmit={handleSubmit}
      />
    </div>
  )
}
