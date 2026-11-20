import { useId, useState, type FormEvent } from 'react'
import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import { useAuth } from '../hooks/useAuth'

function ChangePasswordDialog() {
  const { membership, changePassword, logout } = useAuth()
  const titleId = useId()
  const errorId = useId()
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const required = Boolean(membership?.mustChangePassword)

  if (!required) return null

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    if (saving) return

    if (newPassword.length < 8) {
      setError('New password must be at least 8 characters.')
      return
    }
    if (newPassword !== confirmPassword) {
      setError('New password and confirmation do not match.')
      return
    }
    if (newPassword === currentPassword) {
      setError('New password must be different from the temporary password.')
      return
    }

    setSaving(true)
    setError(null)
    const result = await changePassword(currentPassword, newPassword)
    if (!result.ok) {
      setError(result.error)
      setSaving(false)
      return
    }
    setCurrentPassword('')
    setNewPassword('')
    setConfirmPassword('')
    setSaving(false)
  }

  return (
    <Dialog
      open
      fullWidth
      maxWidth="xs"
      onClose={() => {
        // Required dialog: it cannot be dismissed until the password is changed.
      }}
      aria-labelledby={titleId}
      aria-describedby={error ? errorId : undefined}
      slotProps={{
        paper: {
          component: 'form',
          onSubmit: (event: FormEvent) => {
            void handleSubmit(event)
          },
        },
      }}
    >
      <DialogTitle component="div" sx={{ pb: 1 }}>
        <Typography variant="overline" color="primary" sx={{ display: 'block' }}>
          Security
        </Typography>
        <Typography variant="h2" id={titleId}>
          Change your temporary password
        </Typography>
      </DialogTitle>
      <DialogContent>
        <DialogContentText sx={{ mb: 2 }}>
          Your admin set an initial password for local testing. Choose a new
          password before using the directory.
        </DialogContentText>
        <Stack spacing={2}>
          <TextField
            label="Current temporary password"
            type="password"
            autoComplete="current-password"
            autoFocus
            value={currentPassword}
            onChange={(event) => setCurrentPassword(event.target.value)}
            required
            disabled={saving}
          />
          <TextField
            label="New password"
            type="password"
            autoComplete="new-password"
            value={newPassword}
            onChange={(event) => setNewPassword(event.target.value)}
            required
            disabled={saving}
            slotProps={{ htmlInput: { minLength: 8 } }}
          />
          <TextField
            label="Confirm new password"
            type="password"
            autoComplete="new-password"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            required
            disabled={saving}
            slotProps={{ htmlInput: { minLength: 8 } }}
          />
          {error ? (
            <Alert severity="error" id={errorId}>
              {error}
            </Alert>
          ) : null}
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button
          type="button"
          variant="outlined"
          disabled={saving}
          onClick={() => {
            void logout()
          }}
        >
          Sign out
        </Button>
        <Button type="submit" variant="contained" disabled={saving}>
          {saving ? 'Saving…' : 'Save new password'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default ChangePasswordDialog
