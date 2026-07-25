import { useState } from 'react'
import { createFileRoute, notFound, useNavigate } from '@tanstack/react-router'

import {
  NewsForm,
  type NewsFormValues,
  type toNewsSubmitValues,
} from '@/components/admin/news-form'
import {
  adminGetNews,
  adminListAuthors,
  adminUpdateNews,
} from '@/server/admin/news'

export const Route = createFileRoute('/admin/_authed/news/$slug')({
  loader: async ({ params }) => {
    const [post, authors] = await Promise.all([
      adminGetNews({ data: { slug: params.slug } }),
      adminListAuthors(),
    ])
    if (!post) throw notFound()
    return { post, authors }
  },
  component: EditNews,
  notFoundComponent: () => (
    <p className="text-muted-foreground">Noutatea nu a fost găsită.</p>
  ),
})

function EditNews() {
  const { post, authors } = Route.useLoaderData()
  const navigate = useNavigate()
  const [error, setError] = useState<string | null>(null)

  const initial: NewsFormValues = {
    slug: post.slug,
    titleRo: post.titleRo,
    titleEn: post.titleEn ?? '',
    excerptRo: post.excerptRo,
    excerptEn: post.excerptEn ?? '',
    bodyRo: post.bodyRo,
    bodyEn: post.bodyEn ?? '',
    authorMemberId: post.authorMemberId ?? '',
  }

  async function handleSubmit(values: ReturnType<typeof toNewsSubmitValues>) {
    setError(null)
    const result = await adminUpdateNews({
      data: { currentSlug: post.slug, values },
    })

    if (!result.ok) {
      setError(
        result.error === 'slug-taken'
          ? 'Slug-ul este deja folosit. Alege altul.'
          : 'Noutatea nu a putut fi salvată.',
      )
      throw new Error(result.error)
    }

    await navigate({ to: '/admin/news' })
  }

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-semibold">{post.titleRo}</h2>
        <p className="text-muted-foreground font-mono text-2xs uppercase">
          {post.publishedAt ? 'publicat' : 'ciornă'} · /news/{post.slug}
        </p>
      </div>

      <NewsForm
        // Keyed per record, so two half-edited posts cannot cross drafts.
        draftKey={`news:${post.slug}`}
        initialValues={initial}
        authors={authors}
        publishedAt={post.publishedAt}
        submitLabel="Salvează"
        serverError={error}
        onSubmit={handleSubmit}
      />
    </div>
  )
}
