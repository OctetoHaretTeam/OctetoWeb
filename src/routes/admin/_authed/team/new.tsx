import { useState } from 'react'
import { createFileRoute, useNavigate } from '@tanstack/react-router'

import {
  MemberForm,
  emptyMemberForm,
  type MemberFormValues,
} from '@/components/admin/member-form'
import { adminCreateTeamMember, adminNextTeamOrder } from '@/server/admin/team'

export const Route = createFileRoute('/admin/_authed/team/new')({
  loader: () => adminNextTeamOrder(),
  component: NewMember,
})

function NewMember() {
  const nextOrder = Route.useLoaderData()
  const navigate = useNavigate()
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(values: ReturnType<
    typeof import('@/components/admin/member-form').toSubmitValues
  >) {
    setError(null)
    const result = await adminCreateTeamMember({ data: values })

    if (!result.ok) {
      setError(
        result.error === 'slug-taken'
          ? 'Slug-ul este deja folosit. Alege altul.'
          : 'Membrul nu a putut fi salvat.',
      )
      // Thrown so the form keeps the draft rather than clearing it.
      throw new Error(result.error)
    }

    await navigate({ to: '/admin/team' })
  }

  const initial: MemberFormValues = emptyMemberForm(nextOrder)

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-semibold">Membru nou</h2>
        <p className="text-muted-foreground text-sm">
          Slug-ul se tipărește pe merch — alege-l cu grijă.
        </p>
      </div>

      <MemberForm
        draftKey="team:new"
        initialValues={initial}
        submitLabel="Adaugă membru"
        serverError={error}
        onSubmit={handleSubmit}
      />
    </div>
  )
}
