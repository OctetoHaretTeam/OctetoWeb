import { useState } from 'react'
import { createFileRoute, useNavigate } from '@tanstack/react-router'

import {
  PerformanceForm,
  emptyPerformanceForm,
  type toPerformanceSubmitValues,
} from '@/components/admin/performance-form'
import {
  adminCreatePerformance,
  adminNextPerformanceOrder,
  adminPerformanceSeasons,
} from '@/server/admin/performance'

export const Route = createFileRoute('/admin/_authed/performance/new')({
  loader: async () => {
    const [seasons, nextOrder] = await Promise.all([
      adminPerformanceSeasons(),
      adminNextPerformanceOrder(),
    ])
    return { seasons, nextOrder }
  },
  component: NewPerformance,
})

function NewPerformance() {
  const { seasons, nextOrder } = Route.useLoaderData()
  const navigate = useNavigate()
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(
    values: ReturnType<typeof toPerformanceSubmitValues>,
  ) {
    setError(null)
    const result = await adminCreatePerformance({ data: values })

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
      <h2 className="text-xl font-semibold">Realizare nouă</h2>

      <PerformanceForm
        draftKey="performance:new"
        initialValues={emptyPerformanceForm(nextOrder)}
        seasons={seasons}
        submitLabel="Adaugă realizare"
        serverError={error}
        onSubmit={handleSubmit}
      />
    </div>
  )
}
