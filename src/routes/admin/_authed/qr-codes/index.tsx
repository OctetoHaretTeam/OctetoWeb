import { useState } from 'react'
import { createFileRoute, useRouter } from '@tanstack/react-router'

import { ConfirmDialog } from '@/components/admin/confirm-dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { qrCodeFormSchema } from '@/lib/forms/entities'
import {
  adminCreateQrCode,
  adminDeleteQrCode,
  adminListQrCodes,
  adminUpdateQrCode,
} from '@/server/admin/qr-codes'

/**
 * QR codes — CLAUDE.md §10, for the §6 system.
 *
 * One page with an inline create form rather than separate screens: there are
 * only ever a handful of codes, and seeing them all while adding one is what
 * prevents duplicates.
 *
 * Scan statistics are absent because the `/q/$code` resolver is not built yet.
 */
export const Route = createFileRoute('/admin/_authed/qr-codes/')({
  loader: () => adminListQrCodes(),
  component: AdminQrCodes,
})

const EMPTY = { code: '', label: '', targetPath: '', printedOn: '' }

function AdminQrCodes() {
  const codes = Route.useLoaderData()
  const router = useRouter()
  const [values, setValues] = useState(EMPTY)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function run(action: () => Promise<unknown>, failureMessage: string) {
    setBusy(true)
    setError(null)
    try {
      await action()
      await router.invalidate()
    } catch {
      setError(failureMessage)
    } finally {
      setBusy(false)
    }
  }

  async function handleCreate(event: React.FormEvent) {
    event.preventDefault()
    setErrors({})

    const payload = {
      code: values.code.trim(),
      label: values.label.trim(),
      targetPath: values.targetPath.trim(),
      isActive: true,
      printedOn: values.printedOn.trim() || null,
    }

    const parsed = qrCodeFormSchema.safeParse(payload)
    if (!parsed.success) {
      const fieldErrors: Record<string, string> = {}
      for (const issue of parsed.error.issues) {
        const field = issue.path[0]
        if (typeof field === 'string' && !fieldErrors[field]) {
          fieldErrors[field] = issue.message
        }
      }
      setErrors(fieldErrors)
      return
    }

    setBusy(true)
    setError(null)
    try {
      const result = await adminCreateQrCode({ data: payload })
      if (!result.ok) {
        setError('Codul există deja. Alege altul.')
        return
      }
      setValues(EMPTY)
      await router.invalidate()
    } catch {
      setError('Codul nu a putut fi salvat.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">Coduri QR</h2>
        <p className="text-muted-foreground text-sm">
          Fiecare suprafață tipărită primește propriul cod, ca echipa să vadă ce
          anume aduce vizitatori.
        </p>
      </div>

      {error ? (
        <p role="alert" className="text-destructive text-sm">
          {error}
        </p>
      ) : null}

      <form
        onSubmit={handleCreate}
        className="border-border grid gap-3 rounded-md border p-4 sm:grid-cols-2"
      >
        <Field
          id="qr-code"
          label="Cod"
          hint="Se tipărește. De exemplu m-andrei, pit, robot."
          value={values.code}
          error={errors.code}
          onChange={(v) => setValues((c) => ({ ...c, code: v }))}
        />
        <Field
          id="qr-label"
          label="Etichetă"
          hint="Pentru echipă, nu pentru public."
          value={values.label}
          error={errors.label}
          onChange={(v) => setValues((c) => ({ ...c, label: v }))}
        />
        <Field
          id="qr-target"
          label="Destinație"
          hint="Fără prefix de limbă: /team/andrei. Prefixul se adaugă la scanare."
          value={values.targetPath}
          error={errors.targetPath}
          onChange={(v) => setValues((c) => ({ ...c, targetPath: v }))}
        />
        <Field
          id="qr-printed"
          label="Tipărit la (opțional)"
          hint="Când a fost imprimat/distribuit codul acesta."
          placeholder="AAAA-LL-ZZ"
          value={values.printedOn}
          error={errors.printedOn}
          onChange={(v) => setValues((c) => ({ ...c, printedOn: v }))}
        />

        <div className="sm:col-span-2">
          <Button type="submit" disabled={busy}>
            Adaugă cod
          </Button>
        </div>
      </form>

      {codes.length === 0 ? (
        <div className="border-border rounded-md border border-dashed p-6">
          <p className="font-medium">Încă niciun cod</p>
          <p className="text-muted-foreground mt-1 text-sm">
            Adaugă primul cod înainte de a comanda tricouri sau bannere.
          </p>
        </div>
      ) : (
        <ul className="space-y-2">
          {codes.map((qr) => (
            <li
              key={qr.code}
              className="border-border flex flex-wrap items-center gap-x-3 gap-y-2 rounded-md border px-3 py-2"
            >
              <span className="font-mono text-sm font-semibold">{qr.code}</span>
              <span className="text-muted-foreground text-sm">{qr.label}</span>
              <span className="text-muted-foreground font-mono text-2xs">
                → {qr.targetPath}
              </span>
              {qr.printedOn ? (
                <span className="text-muted-foreground font-mono text-2xs">
                  {qr.printedOn}
                </span>
              ) : null}

              <div className="ml-auto flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <Switch
                    id={`active-${qr.code}`}
                    checked={qr.isActive}
                    disabled={busy}
                    onCheckedChange={(checked) =>
                      void run(
                        () =>
                          adminUpdateQrCode({
                            data: {
                              currentCode: qr.code,
                              values: {
                                code: qr.code,
                                label: qr.label,
                                targetPath: qr.targetPath,
                                printedOn: qr.printedOn,
                                isActive: checked,
                              },
                            },
                          }),
                        'Codul nu a putut fi actualizat.',
                      )
                    }
                  />
                  <Label htmlFor={`active-${qr.code}`} className="text-xs">
                    activ
                  </Label>
                </div>

                <ConfirmDialog
                  trigger={
                    <button
                      type="button"
                      className="text-destructive text-xs underline"
                    >
                      Șterge
                    </button>
                  }
                  title={`Ștergi codul ${qr.code}?`}
                  description="Istoricul scanărilor dispare odată cu el, iar suprafețele deja tipărite nu mai duc nicăieri. De obicei e mai bine să îl dezactivezi."
                  confirmLabel="Șterge"
                  disabled={busy}
                  onConfirm={() =>
                    void run(
                      () => adminDeleteQrCode({ data: { code: qr.code } }),
                      'Codul nu a putut fi șters.',
                    )
                  }
                />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

function Field({
  id,
  label,
  hint,
  value,
  error,
  placeholder,
  onChange,
}: {
  id: string
  label: string
  hint: string
  value: string
  error?: string
  placeholder?: string
  onChange: (value: string) => void
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        value={value}
        placeholder={placeholder}
        aria-invalid={error ? true : undefined}
        onChange={(event) => onChange(event.target.value)}
      />
      <p className="text-muted-foreground text-xs">{hint}</p>
      {error ? (
        <p role="alert" className="text-destructive text-xs">
          {error}
        </p>
      ) : null}
    </div>
  )
}
