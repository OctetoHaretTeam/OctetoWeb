import { useState } from 'react'
import { createFileRoute, notFound, useNavigate } from '@tanstack/react-router'

import {
  PerformanceForm,
  type PerformanceFormValues,
  type toPerformanceSubmitValues,
} from '@/components/admin/performance-form'
import {
  adminGetPerformance,
  adminPerformanceSeasons,
  adminUpdatePerformance,
} from '@/server/admin/performance'

export const Route = createFileRoute('/admin/_authed/performance/$slug')({
  loader: async ({ params }) => {
    const [entry, seasons] = await Promise.all([
      adminGetPerformance({ data: { slug: params.slug } }),
      adminPerformanceSeasons(),
    ])
    if (!entry) throw notFound()
    return { entry, seasons }
  },
  component: EditPerformance,
  notFoundComponent: () => (
    <p className="text-muted-foreground">Realizarea nu a fost găsită.</p>
  ),
})

function EditPerformance() {
  const { entry, seasons } = Route.useLoaderData()
  const navigate = useNavigate()
  const [error, setError] = useState<string | null>(null)

  const initial: PerformanceFormValues = {
    slug: entry.slug,
    branch: entry.branch,
    category: entry.category,
    titleRo: entry.titleRo,
    titleEn: entry.titleEn ?? '',
    summaryRo: entry.summaryRo,
    summaryEn: entry.summaryEn ?? '',
    bodyRo: entry.bodyRo,
    bodyEn: entry.bodyEn ?? '',
    coverImage: entry.coverImage,
    gallery: entry.gallery,
    date: entry.date,
    seasonId: entry.seasonId ?? '',
    peopleReached: entry.metrics?.peopleReached?.toString() ?? '',
    schoolsVisited: entry.metrics?.schoolsVisited?.toString() ?? '',
    fundsRaisedMdl: entry.metrics?.fundsRaisedMdl?.toString() ?? '',
    isFeatured: entry.isFeatured,
    displayOrder: String(entry.displayOrder),
  }

  async function handleSubmit(
    values: ReturnType<typeof toPerformanceSubmitValues>,
  ) {
    setError(null)
    const result = await adminUpdatePerformance({
      data: { currentSlug: entry.slug, values },
    })

    if (!result.ok) {
      setError(
        result.error === 'slug-taken'
          ? 'Slug-ul este deja folosit. Alege altul.'
          : 'Realizarea nu a putut fi salvată.',
      )
      throw new Error(result.error)
    }

    await navigate({ to: '/admin/performance' })
  }

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-semibold">{entry.titleRo}</h2>
        <p className="text-muted-foreground font-mono text-2xs uppercase">
          {entry.branch} · {entry.category}
        </p>
      </div>

      <PerformanceForm
        draftKey={`performance:${entry.slug}`}
        initialValues={initial}
        seasons={seasons}
        submitLabel="Salvează"
        serverError={error}
        onSubmit={handleSubmit}
      />
    </div>
  )
}
