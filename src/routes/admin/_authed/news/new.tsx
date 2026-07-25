import { useState } from 'react'
import { createFileRoute, useNavigate } from '@tanstack/react-router'

import {
  NewsForm,
  emptyNewsForm,
  type toNewsSubmitValues,
} from '@/components/admin/news-form'
import { adminCreateNews, adminListAuthors } from '@/server/admin/news'

export const Route = createFileRoute('/admin/_authed/news/new')({
  loader: () => adminListAuthors(),
  component: NewNews,
})

function NewNews() {
  const authors = Route.useLoaderData()
  const navigate = useNavigate()
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(values: ReturnType<typeof toNewsSubmitValues>) {
    setError(null)
    const result = await adminCreateNews({ data: values })

    if (!result.ok) {
      setError(
        result.error === 'slug-taken'
          ? 'Slug-ul este deja folosit. Alege altul.'
          : 'Noutatea nu a putut fi salvată.',
      )
      // Thrown so the form keeps the draft instead of clearing it.
      throw new Error(result.error)
    }

    await navigate({ to: '/admin/news' })
  }

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-semibold">Noutate nouă</h2>
        <p className="text-muted-foreground text-sm">
          Se salvează ca ciornă. O publici din listă, când e gata.
        </p>
      </div>

      <NewsForm
        draftKey="news:new"
        initialValues={emptyNewsForm()}
        authors={authors}
        publishedAt={null}
        submitLabel="Salvează ciorna"
        serverError={error}
        onSubmit={handleSubmit}
      />
    </div>
  )
}
