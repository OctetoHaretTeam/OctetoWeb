import { useState } from 'react'
import { createFileRoute, notFound, useNavigate } from '@tanstack/react-router'

import {
  MemberForm,
  type MemberFormValues,
} from '@/components/admin/member-form'
import { adminGetTeamMember, adminUpdateTeamMember } from '@/server/admin/team'

export const Route = createFileRoute('/admin/_authed/team/$slug')({
  loader: async ({ params }) => {
    const member = await adminGetTeamMember({ data: { slug: params.slug } })
    if (!member) throw notFound()
    return member
  },
  component: EditMember,
  notFoundComponent: () => (
    <p className="text-muted-foreground">Membrul nu a fost găsit.</p>
  ),
})

function EditMember() {
  const member = Route.useLoaderData()
  const navigate = useNavigate()
  const [error, setError] = useState<string | null>(null)

  const initial: MemberFormValues = {
    slug: member.slug,
    name: member.name,
    roleRo: member.roleRo,
    roleEn: member.roleEn ?? '',
    branch: member.branch,
    descriptionRo: member.descriptionRo ?? '',
    descriptionEn: member.descriptionEn ?? '',
    instagramUrl: member.instagramUrl ?? '',
    octetIndex: String(member.octetIndex),
    displayOrder: String(member.displayOrder),
    isActive: member.isActive,
    photoConsent: member.photoConsent,
    fullNamePublic: member.fullNamePublic,
  }

  async function handleSubmit(values: ReturnType<
    typeof import('@/components/admin/member-form').toSubmitValues
  >) {
    setError(null)
    const result = await adminUpdateTeamMember({
      data: { currentSlug: member.slug, values },
    })

    if (!result.ok) {
      setError(
        result.error === 'slug-taken'
          ? 'Slug-ul este deja folosit. Alege altul.'
          : 'Membrul nu a putut fi salvat.',
      )
      throw new Error(result.error)
    }

    await navigate({ to: '/admin/team' })
  }

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-semibold">{member.name}</h2>
        <p className="text-muted-foreground font-mono text-2xs uppercase">
          /team/{member.slug}
        </p>
      </div>

      <MemberForm
        // Keyed per record, so two half-edited members cannot overwrite
        // each other's drafts.
        draftKey={`team:${member.slug}`}
        initialValues={initial}
        submitLabel="Salvează"
        serverError={error}
        onSubmit={handleSubmit}
      />
    </div>
  )
}
