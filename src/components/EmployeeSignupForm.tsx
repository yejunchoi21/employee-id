import { useEffect, useId, useState, type FormEvent } from 'react'
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import { SUGGESTED_DEPARTMENTS } from '../data/departments'
import type { EmployeeSignupInput } from '../utils/createEmployee'
import PortraitUploadField from './PortraitUploadField'
interface EmployeeSignupFormProps {
  onSubmit: (
    input: EmployeeSignupInput,
  ) =>
    | { ok: true }
    | { ok: false; error: string }
    | Promise<{ ok: true } | { ok: false; error: string }>
  submitLabel?: string
}

const emptyForm: EmployeeSignupInput = {
  name: '',
  title: '',
  department: '',
  office: '',
  email: '',
  phone: '',
  manager: '',
  bio: '',
  skills: '',
  chatProfileUrl: '',
  timeZone: '',
  askMeAbout: '',
}

function EmployeeSignupForm({
  onSubmit,
  submitLabel = 'Create my card',
}: EmployeeSignupFormProps) {
  const formId = useId()
  const [form, setForm] = useState<EmployeeSignupInput>(emptyForm)
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isProcessingPortrait, setIsProcessingPortrait] = useState(false)
  const [portraitBlob, setPortraitBlob] = useState<Blob | null>(null)
  const [portraitPreviewUrl, setPortraitPreviewUrl] = useState<string | null>(
    null,
  )

  useEffect(() => {
    return () => {
      if (portraitPreviewUrl) {
        URL.revokeObjectURL(portraitPreviewUrl)
      }
    }
  }, [portraitPreviewUrl])

  const updateField = <K extends keyof EmployeeSignupInput>(
    key: K,
    value: EmployeeSignupInput[K],
  ) => {
    setForm((current) => ({ ...current, [key]: value }))
    setError(null)
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (isSubmitting || isProcessingPortrait) return

    setIsSubmitting(true)
    setError(null)

    try {
      const portraitId = portraitBlob ? crypto.randomUUID() : undefined
      const result = await onSubmit({
        ...form,
        portraitId,
        photoUrl: portraitPreviewUrl || undefined,
        portraitBlob,
      })

      if (!result.ok) {
        setError(result.error)
      }
    } catch {
      setError('Something went wrong while creating your card. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const busy = isSubmitting || isProcessingPortrait

  return (
    <Paper component="section" aria-labelledby={`${formId}-title`} sx={{ p: { xs: 2, sm: 3 } }}>
      <Box sx={{ mb: 2 }}>
        <Typography variant="h2" id={`${formId}-title`}>
          Sign up for the directory
        </Typography>
        <Typography variant="body2" sx={{ mt: 0.5, maxWidth: 640 }}>
          Add your custom employee info to create a card for the 360° rack.
          This is a browser-only demo, not a real account registration system.
        </Typography>
      </Box>

      <Stack
        component="form"
        spacing={2}
        onSubmit={(event: FormEvent<HTMLFormElement>) => void handleSubmit(event)}
      >
        <PortraitUploadField
          portraitBlob={portraitBlob}
          previewUrl={portraitPreviewUrl}
          disabled={isSubmitting}
          onProcessingChange={setIsProcessingPortrait}
          onPortraitChange={({ blob, previewUrl }) => {
            setPortraitBlob(blob)
            setPortraitPreviewUrl(previewUrl)
            setError(null)
          }}
        />

        <Box
          sx={{
            display: 'grid',
            gap: 2,
            gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, minmax(0, 1fr))' },
          }}
        >
          <TextField
            id={`${formId}-name`}
            name="name"
            label="Full name"
            required
            autoComplete="name"
            value={form.name}
            disabled={busy}
            onChange={(event) => updateField('name', event.target.value)}
          />
          <TextField
            id={`${formId}-title-input`}
            name="title"
            label="Job title"
            required
            value={form.title}
            disabled={busy}
            onChange={(event) => updateField('title', event.target.value)}
          />
          <Autocomplete
            freeSolo
            disabled={busy}
            options={SUGGESTED_DEPARTMENTS}
            inputValue={form.department}
            onInputChange={(_, value) => updateField('department', value)}
            renderInput={(params) => (
              <TextField
                {...params}
                id={`${formId}-department`}
                name="department"
                label="Department"
                required
              />
            )}
          />
          <TextField
            id={`${formId}-office`}
            name="office"
            label="Office"
            required
            value={form.office}
            disabled={busy}
            onChange={(event) => updateField('office', event.target.value)}
          />
          <TextField
            id={`${formId}-email`}
            name="email"
            type="email"
            label="Work email"
            required
            autoComplete="email"
            value={form.email}
            disabled={busy}
            onChange={(event) => updateField('email', event.target.value)}
          />
          <TextField
            id={`${formId}-phone`}
            name="phone"
            type="tel"
            label="Work phone"
            required
            autoComplete="tel"
            value={form.phone}
            disabled={busy}
            onChange={(event) => updateField('phone', event.target.value)}
          />
          <TextField
            id={`${formId}-manager`}
            name="manager"
            label="Manager"
            required
            value={form.manager}
            disabled={busy}
            onChange={(event) => updateField('manager', event.target.value)}
          />
          <TextField
            id={`${formId}-timezone`}
            name="timeZone"
            label="Time zone (optional)"
            placeholder="America/Los_Angeles"
            value={form.timeZone ?? ''}
            disabled={busy}
            onChange={(event) => updateField('timeZone', event.target.value)}
          />
          <TextField
            id={`${formId}-chat`}
            name="chatProfileUrl"
            type="url"
            label="Work chat profile URL (optional)"
            placeholder="https://"
            helperText="HTTPS links only for the open-chat action."
            value={form.chatProfileUrl ?? ''}
            disabled={busy}
            onChange={(event) =>
              updateField('chatProfileUrl', event.target.value)
            }
          />
          <TextField
            id={`${formId}-skills`}
            name="skills"
            label="Skills"
            required
            placeholder="Design systems, React, Writing"
            helperText="Separate skills with commas."
            value={form.skills}
            disabled={busy}
            onChange={(event) => updateField('skills', event.target.value)}
          />
        </Box>

        <TextField
          id={`${formId}-ask`}
          name="askMeAbout"
          label="Ask me about (optional)"
          multiline
          minRows={3}
          placeholder="Design systems, onboarding, accessibility reviews"
          value={form.askMeAbout ?? ''}
          disabled={busy}
          onChange={(event) => updateField('askMeAbout', event.target.value)}
        />

        <TextField
          id={`${formId}-bio`}
          name="bio"
          label="Short bio"
          multiline
          minRows={4}
          required
          value={form.bio}
          disabled={busy}
          onChange={(event) => updateField('bio', event.target.value)}
        />

        {error ? (
          <Alert severity="error">{error}</Alert>
        ) : (
          <Typography variant="caption" color="text.secondary">
            Browser-only demo. No password, accounts, or database are used.
          </Typography>
        )}
        <Box>
          <Button type="submit" variant="contained" disabled={busy}>
            {isProcessingPortrait
              ? 'Processing photo…'
              : isSubmitting
                ? 'Creating…'
                : submitLabel}
          </Button>
        </Box>
      </Stack>
    </Paper>
  )
}

export default EmployeeSignupForm
