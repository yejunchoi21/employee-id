import { useEffect, useId, useRef, useState, type FormEvent } from 'react'
import {
  createHelpRequest,
  type HelpRequestPriority,
} from '../api/helpRequests'
import { ApiError } from '../api/client'
import type { Employee } from '../data/employee'
import './RequestHelpDialog.css'

interface RequestHelpDialogProps {
  employee: Employee | null
  recipientEmployeeId: string | null
  onClose: () => void
  onCreated: () => void
}

const priorities: Array<{ value: HelpRequestPriority; label: string }> = [
  { value: 'low', label: 'Low' },
  { value: 'normal', label: 'Normal' },
  { value: 'high', label: 'High' },
]

function RequestHelpForm({
  employee,
  recipientEmployeeId,
  onClose,
  onCreated,
}: {
  employee: Employee
  recipientEmployeeId: string
  onClose: () => void
  onCreated: () => void
}) {
  const subjectRef = useRef<HTMLInputElement>(null)
  const titleId = useId()
  const errorId = useId()
  const [subject, setSubject] = useState('')
  const [question, setQuestion] = useState('')
  const [priority, setPriority] = useState<HelpRequestPriority>('normal')
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    subjectRef.current?.focus()
  }, [])

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    if (saving) return

    const trimmedSubject = subject.trim()
    const trimmedQuestion = question.trim()
    if (!trimmedSubject || !trimmedQuestion) {
      setError('Subject and question are required.')
      return
    }

    setSaving(true)
    setError(null)
    try {
      await createHelpRequest({
        recipientEmployeeId,
        subject: trimmedSubject,
        question: trimmedQuestion,
        priority,
      })
      onCreated()
      onClose()
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : 'Could not create the help request.',
      )
      setSaving(false)
    }
  }

  return (
    <form
      className="request-help__sheet"
      onClick={(event) => event.stopPropagation()}
      onSubmit={(event) => {
        void handleSubmit(event)
      }}
    >
      <header className="request-help__header">
        <div>
          <p className="request-help__eyebrow">Help request</p>
          <h2 id={titleId}>Request help from {employee.name}</h2>
        </div>
        <button type="button" onClick={onClose} disabled={saving}>
          Close
        </button>
      </header>

      <div className="request-help__body">
        <label className="request-help__field">
          <span>Subject</span>
          <input
            ref={subjectRef}
            value={subject}
            onChange={(event) => setSubject(event.target.value)}
            maxLength={160}
            required
            disabled={saving}
            autoComplete="off"
          />
        </label>

        <label className="request-help__field">
          <span>Question</span>
          <textarea
            value={question}
            onChange={(event) => setQuestion(event.target.value)}
            maxLength={4000}
            rows={5}
            required
            disabled={saving}
          />
        </label>

        <fieldset className="request-help__priority" disabled={saving}>
          <legend>Priority</legend>
          <div className="request-help__priority-options">
            {priorities.map((option) => (
              <label key={option.value}>
                <input
                  type="radio"
                  name="help-priority"
                  value={option.value}
                  checked={priority === option.value}
                  onChange={() => setPriority(option.value)}
                />
                {option.label}
              </label>
            ))}
          </div>
        </fieldset>

        {error ? (
          <p id={errorId} className="request-help__error" role="alert">
            {error}
          </p>
        ) : null}
      </div>

      <footer className="request-help__footer">
        <button type="button" onClick={onClose} disabled={saving}>
          Cancel
        </button>
        <button type="submit" disabled={saving}>
          {saving ? 'Sending…' : 'Send request'}
        </button>
      </footer>
    </form>
  )
}

function RequestHelpDialog({
  employee,
  recipientEmployeeId,
  onClose,
  onCreated,
}: RequestHelpDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return

    const handleClose = () => {
      onClose()
    }
    const handleCancel = (event: Event) => {
      event.preventDefault()
      dialog.close()
    }

    dialog.addEventListener('close', handleClose)
    dialog.addEventListener('cancel', handleCancel)
    return () => {
      dialog.removeEventListener('close', handleClose)
      dialog.removeEventListener('cancel', handleCancel)
    }
  }, [onClose])

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return

    if (employee && recipientEmployeeId) {
      if (!dialog.open) dialog.showModal()
      return
    }

    if (dialog.open) dialog.close()
  }, [employee, recipientEmployeeId])

  const requestClose = () => {
    dialogRef.current?.close()
  }

  return (
    <dialog
      ref={dialogRef}
      className="request-help"
      onClick={(event) => {
        if (event.target === dialogRef.current) requestClose()
      }}
    >
      {employee && recipientEmployeeId ? (
        <RequestHelpForm
          key={`${employee.id}-${recipientEmployeeId}`}
          employee={employee}
          recipientEmployeeId={recipientEmployeeId}
          onClose={requestClose}
          onCreated={onCreated}
        />
      ) : null}
    </dialog>
  )
}

export default RequestHelpDialog
