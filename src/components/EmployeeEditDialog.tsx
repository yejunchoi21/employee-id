import { useEffect, useId, useRef, useState, type FormEvent } from 'react'
import type { Employee } from '../data/employee'
import type { EmployeeSignupInput } from '../utils/createEmployee'
import PortraitUploadField from './PortraitUploadField'
import './EmployeeEditDialog.css'
import './EmployeeSignupForm.css'

interface EmployeeEditDialogProps {
  employee: Employee | null
  onClose: () => void
  onSave: (
    employeeId: string,
    input: EmployeeSignupInput,
  ) => Promise<{ ok: true } | { ok: false; error: string }>
  onDelete?: (employee: Employee) => Promise<void>
}

function EmployeeEditDialog({
  employee,
  onClose,
  onSave,
  onDelete,
}: EmployeeEditDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const closeButtonRef = useRef<HTMLButtonElement>(null)
  const formId = useId()
  const titleId = useId()

  const [form, setForm] = useState<EmployeeSignupInput | null>(null)
  const [formEmployeeId, setFormEmployeeId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isProcessingPortrait, setIsProcessingPortrait] = useState(false)
  const [portraitBlob, setPortraitBlob] = useState<Blob | null>(null)
  const [portraitPreviewUrl, setPortraitPreviewUrl] = useState<string | null>(
    null,
  )
  const [removePortrait, setRemovePortrait] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const nextEmployeeId = employee?.id ?? null
  if (formEmployeeId !== nextEmployeeId) {
    setFormEmployeeId(nextEmployeeId)
    setError(null)
    setPortraitBlob(null)
    setPortraitPreviewUrl(null)
    setRemovePortrait(false)
    setIsSubmitting(false)
    setIsProcessingPortrait(false)
    setIsDeleting(false)

    if (!employee) {
      setForm(null)
    } else {
      setForm({
        name: employee.name,
        title: employee.title,
        department: employee.department,
        office: employee.office,
        email: employee.email,
        phone: employee.phone,
        manager: employee.manager,
        bio: employee.bio,
        skills: employee.skills.join(', '),
      })
    }
  }

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return

    const handleClose = () => {
      document.body.classList.remove('edit-open')
      onClose()
    }

    dialog.addEventListener('close', handleClose)
    return () => dialog.removeEventListener('close', handleClose)
  }, [onClose])

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return

    if (employee) {
      if (!dialog.open) {
        dialog.showModal()
      }
      document.body.classList.add('edit-open')
      window.requestAnimationFrame(() => {
        closeButtonRef.current?.focus()
      })
      return
    }

    if (dialog.open) {
      dialog.close()
    }
  }, [employee])

  useEffect(() => {
    return () => {
      document.body.classList.remove('edit-open')
    }
  }, [])

  const requestClose = () => {
    dialogRef.current?.close()
  }

  const updateField = <K extends keyof EmployeeSignupInput>(
    key: K,
    value: EmployeeSignupInput[K],
  ) => {
    setForm((current) => (current ? { ...current, [key]: value } : current))
    setError(null)
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!employee || !form || isSubmitting || isProcessingPortrait || isDeleting)
      return

    setIsSubmitting(true)
    setError(null)

    try {
      const result = await onSave(employee.id, {
        ...form,
        portraitBlob,
        portraitId: portraitBlob ? crypto.randomUUID() : undefined,
        photoUrl: portraitPreviewUrl || undefined,
        removePortrait: removePortrait && !portraitBlob,
      })

      if (!result.ok) {
        setError(result.error)
        return
      }

      requestClose()
    } catch {
      setError('Could not save your changes. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!employee || !onDelete || busy) return

    const confirmed = window.confirm(
      `Delete ${employee.name}'s card? This cannot be undone.`,
    )
    if (!confirmed) return

    setIsDeleting(true)
    setError(null)

    try {
      await onDelete(employee)
      requestClose()
    } catch {
      setError('Could not delete this card. Please try again.')
      setIsDeleting(false)
    }
  }

  const busy = isSubmitting || isProcessingPortrait || isDeleting
  const previewUrl =
    portraitPreviewUrl ||
    (removePortrait ? null : employee?.photoUrl || null)

  return (
    <dialog
      ref={dialogRef}
      className="employee-edit"
      aria-labelledby={titleId}
      onClick={(event) => {
        if (event.target === dialogRef.current) {
          requestClose()
        }
      }}
    >
      {employee && form ? (
        <div
          className="employee-edit__sheet"
          onClick={(event) => event.stopPropagation()}
        >
          <header className="employee-edit__header">
            <div>
              <p className="employee-edit__eyebrow">Your card</p>
              <h2 id={titleId} className="employee-edit__title">
                Edit employee card
              </h2>
            </div>
            <button
              ref={closeButtonRef}
              type="button"
              className="employee-edit__close"
              onClick={requestClose}
            >
              Close
            </button>
          </header>

          <form
            className="signup__form employee-edit__form"
            onSubmit={(event) => void handleSubmit(event)}
          >
            <div className="signup__field signup__field--full">
              <PortraitUploadField
                portraitBlob={portraitBlob}
                previewUrl={previewUrl}
                disabled={isSubmitting}
                onProcessingChange={setIsProcessingPortrait}
                onPortraitChange={({ blob, previewUrl: nextPreview }) => {
                  setPortraitBlob(blob)
                  setPortraitPreviewUrl(nextPreview)
                  setRemovePortrait(blob === null && nextPreview === null)
                  setError(null)
                }}
              />
            </div>

            <div className="signup__grid">
              <div className="signup__field">
                <label htmlFor={`${formId}-name`}>Full name</label>
                <input
                  id={`${formId}-name`}
                  type="text"
                  required
                  value={form.name}
                  disabled={busy}
                  onChange={(event) => updateField('name', event.target.value)}
                />
              </div>
              <div className="signup__field">
                <label htmlFor={`${formId}-title`}>Job title</label>
                <input
                  id={`${formId}-title`}
                  type="text"
                  required
                  value={form.title}
                  disabled={busy}
                  onChange={(event) => updateField('title', event.target.value)}
                />
              </div>
              <div className="signup__field">
                <label htmlFor={`${formId}-department`}>Department</label>
                <input
                  id={`${formId}-department`}
                  type="text"
                  required
                  value={form.department}
                  disabled={busy}
                  onChange={(event) =>
                    updateField('department', event.target.value)
                  }
                />
              </div>
              <div className="signup__field">
                <label htmlFor={`${formId}-office`}>Office</label>
                <input
                  id={`${formId}-office`}
                  type="text"
                  required
                  value={form.office}
                  disabled={busy}
                  onChange={(event) => updateField('office', event.target.value)}
                />
              </div>
              <div className="signup__field">
                <label htmlFor={`${formId}-email`}>Work email</label>
                <input
                  id={`${formId}-email`}
                  type="email"
                  required
                  value={form.email}
                  disabled={busy}
                  onChange={(event) => updateField('email', event.target.value)}
                />
              </div>
              <div className="signup__field">
                <label htmlFor={`${formId}-phone`}>Work phone</label>
                <input
                  id={`${formId}-phone`}
                  type="tel"
                  required
                  value={form.phone}
                  disabled={busy}
                  onChange={(event) => updateField('phone', event.target.value)}
                />
              </div>
              <div className="signup__field">
                <label htmlFor={`${formId}-manager`}>Manager</label>
                <input
                  id={`${formId}-manager`}
                  type="text"
                  required
                  value={form.manager}
                  disabled={busy}
                  onChange={(event) =>
                    updateField('manager', event.target.value)
                  }
                />
              </div>
              <div className="signup__field">
                <label htmlFor={`${formId}-skills`}>Skills</label>
                <input
                  id={`${formId}-skills`}
                  type="text"
                  required
                  value={form.skills}
                  disabled={busy}
                  onChange={(event) => updateField('skills', event.target.value)}
                />
              </div>
            </div>

            <div className="signup__field signup__field--full">
              <label htmlFor={`${formId}-bio`}>Short bio</label>
              <textarea
                id={`${formId}-bio`}
                required
                rows={4}
                value={form.bio}
                disabled={busy}
                onChange={(event) => updateField('bio', event.target.value)}
              />
            </div>

            <div className="signup__footer">
              {error ? (
                <p className="signup__error" role="alert">
                  {error}
                </p>
              ) : (
                <p className="signup__help">
                  You can only edit or delete cards you added in this browser.
                </p>
              )}
              <div className="employee-edit__actions">
                {onDelete ? (
                  <button
                    type="button"
                    className="employee-edit__delete"
                    disabled={busy}
                    onClick={() => {
                      void handleDelete()
                    }}
                  >
                    {isDeleting ? 'Deleting…' : 'Delete card'}
                  </button>
                ) : null}
                <button type="submit" className="signup__submit" disabled={busy}>
                  {isProcessingPortrait
                    ? 'Processing photo…'
                    : isSubmitting
                      ? 'Saving…'
                      : 'Save changes'}
                </button>
              </div>
            </div>
          </form>
        </div>
      ) : null}
    </dialog>
  )
}

export default EmployeeEditDialog
