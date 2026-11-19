import { useEffect, useId, useRef, useState, type FormEvent } from 'react'
import { useAuth } from '../hooks/useAuth'
import './ChangePasswordDialog.css'

function ChangePasswordDialog() {
  const { membership, changePassword, logout } = useAuth()
  const dialogRef = useRef<HTMLDialogElement>(null)
  const currentRef = useRef<HTMLInputElement>(null)
  const titleId = useId()
  const errorId = useId()
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const required = Boolean(membership?.mustChangePassword)

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return

    if (required) {
      if (!dialog.open) dialog.showModal()
      window.requestAnimationFrame(() => currentRef.current?.focus())
      return
    }

    if (dialog.open) dialog.close()
  }, [required])

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
    <dialog
      ref={dialogRef}
      className="change-password"
      aria-labelledby={titleId}
      aria-describedby={error ? errorId : undefined}
      onCancel={(event) => event.preventDefault()}
    >
      <form
        className="change-password__sheet"
        onSubmit={(event) => {
          void handleSubmit(event)
        }}
      >
        <header>
          <p className="change-password__eyebrow">Security</p>
          <h2 id={titleId}>Change your temporary password</h2>
          <p>
            Your admin set an initial password for local testing. Choose a new
            password before using the directory.
          </p>
        </header>

        <label>
          <span>Current temporary password</span>
          <input
            ref={currentRef}
            type="password"
            autoComplete="current-password"
            value={currentPassword}
            onChange={(event) => setCurrentPassword(event.target.value)}
            required
            disabled={saving}
          />
        </label>

        <label>
          <span>New password</span>
          <input
            type="password"
            autoComplete="new-password"
            value={newPassword}
            onChange={(event) => setNewPassword(event.target.value)}
            required
            minLength={8}
            disabled={saving}
          />
        </label>

        <label>
          <span>Confirm new password</span>
          <input
            type="password"
            autoComplete="new-password"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            required
            minLength={8}
            disabled={saving}
          />
        </label>

        {error ? (
          <p id={errorId} className="change-password__error" role="alert">
            {error}
          </p>
        ) : null}

        <footer>
          <button
            type="button"
            className="is-secondary"
            disabled={saving}
            onClick={() => {
              void logout()
            }}
          >
            Sign out
          </button>
          <button type="submit" disabled={saving}>
            {saving ? 'Saving…' : 'Save new password'}
          </button>
        </footer>
      </form>
    </dialog>
  )
}

export default ChangePasswordDialog
