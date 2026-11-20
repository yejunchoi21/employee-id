import { useId, useState, type FormEvent } from 'react'
import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import type { Employee } from '../data/employee'
import type { EmployeeSignupInput } from '../utils/createEmployee'
import PortraitUploadField from './PortraitUploadField'

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
        chatProfileUrl: employee.chatProfileUrl ?? '',
        timeZone: employee.timeZone ?? '',
        askMeAbout: employee.askMeAbout ?? '',
      })
    }
  }

  const requestClose = () => {
    onClose()
  }

  const updateField = <K extends keyof EmployeeSignupInput>(
    key: K,
    value: EmployeeSignupInput[K],
  ) => {
    setForm((current) => (current ? { ...current, [key]: value } : current))
    setError(null)
  }

  const handleSubmit = async (event: FormEvent) => {
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
    <Dialog
      open={Boolean(employee && form)}
      onClose={requestClose}
      scroll="paper"
      fullWidth
      maxWidth="md"
      aria-labelledby={titleId}
      transitionDuration={{ enter: 150, exit: 0 }}
      slotProps={{
        paper: {
          component: 'form',
          onSubmit: (event: FormEvent) => {
            void handleSubmit(event)
          },
        },
      }}
    >
      {employee && form ? (
        <>
          <DialogTitle component="div" sx={{ pb: 1 }}>
            <Typography variant="overline" color="primary" sx={{ display: 'block' }}>
              Your card
            </Typography>
            <Typography variant="h2" id={titleId}>
              Edit employee card
            </Typography>
          </DialogTitle>

          <DialogContent dividers>
            <Stack spacing={2}>
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

              <Box
                sx={{
                  display: 'grid',
                  gap: 2,
                  gridTemplateColumns: {
                    xs: '1fr',
                    sm: 'repeat(2, minmax(0, 1fr))',
                  },
                }}
              >
                <TextField
                  id={`${formId}-name`}
                  label="Full name"
                  required
                  value={form.name}
                  disabled={busy}
                  onChange={(event) => updateField('name', event.target.value)}
                />
                <TextField
                  id={`${formId}-title-input`}
                  label="Job title"
                  required
                  value={form.title}
                  disabled={busy}
                  onChange={(event) => updateField('title', event.target.value)}
                />
                <TextField
                  id={`${formId}-department`}
                  label="Department"
                  required
                  value={form.department}
                  disabled={busy}
                  onChange={(event) =>
                    updateField('department', event.target.value)
                  }
                />
                <TextField
                  id={`${formId}-office`}
                  label="Office"
                  required
                  value={form.office}
                  disabled={busy}
                  onChange={(event) => updateField('office', event.target.value)}
                />
                <TextField
                  id={`${formId}-email`}
                  type="email"
                  label="Work email"
                  required
                  value={form.email}
                  disabled={busy}
                  onChange={(event) => updateField('email', event.target.value)}
                />
                <TextField
                  id={`${formId}-phone`}
                  type="tel"
                  label="Work phone"
                  required
                  value={form.phone}
                  disabled={busy}
                  onChange={(event) => updateField('phone', event.target.value)}
                />
                <TextField
                  id={`${formId}-manager`}
                  label="Manager"
                  required
                  value={form.manager}
                  disabled={busy}
                  onChange={(event) =>
                    updateField('manager', event.target.value)
                  }
                />
                <TextField
                  id={`${formId}-timezone`}
                  label="Time zone (optional)"
                  placeholder="America/Los_Angeles"
                  value={form.timeZone ?? ''}
                  disabled={busy}
                  onChange={(event) => updateField('timeZone', event.target.value)}
                />
                <TextField
                  id={`${formId}-chat`}
                  type="url"
                  label="Work chat profile URL (optional)"
                  placeholder="https://"
                  value={form.chatProfileUrl ?? ''}
                  disabled={busy}
                  onChange={(event) =>
                    updateField('chatProfileUrl', event.target.value)
                  }
                />
                <TextField
                  id={`${formId}-skills`}
                  label="Skills"
                  required
                  value={form.skills}
                  disabled={busy}
                  onChange={(event) => updateField('skills', event.target.value)}
                />
              </Box>

              <TextField
                id={`${formId}-ask`}
                label="Ask me about (optional)"
                multiline
                minRows={3}
                value={form.askMeAbout ?? ''}
                disabled={busy}
                onChange={(event) =>
                  updateField('askMeAbout', event.target.value)
                }
              />

              <TextField
                id={`${formId}-bio`}
                label="Short bio"
                required
                multiline
                minRows={4}
                value={form.bio}
                disabled={busy}
                onChange={(event) => updateField('bio', event.target.value)}
              />

              {error ? (
                <Alert severity="error">{error}</Alert>
              ) : (
                <Typography variant="caption" color="text.secondary">
                  You can only edit or delete cards you added in this browser.
                </Typography>
              )}
            </Stack>
          </DialogContent>

          <DialogActions sx={{ px: 3, py: 1.5, flexWrap: 'wrap', gap: 1 }}>
            <Button type="button" onClick={requestClose}>
              Close
            </Button>
            {onDelete ? (
              <Button
                type="button"
                variant="outlined"
                color="error"
                disabled={busy}
                onClick={() => {
                  void handleDelete()
                }}
              >
                {isDeleting ? 'Deleting…' : 'Delete card'}
              </Button>
            ) : null}
            <Button type="submit" variant="contained" disabled={busy}>
              {isProcessingPortrait
                ? 'Processing photo…'
                : isSubmitting
                  ? 'Saving…'
                  : 'Save changes'}
            </Button>
          </DialogActions>
        </>
      ) : null}
    </Dialog>
  )
}

export default EmployeeEditDialog
