import { useId, useState, type FormEvent } from 'react'
import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  FormControlLabel,
  FormLabel,
  Radio,
  RadioGroup,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import {
  createHelpRequest,
  type HelpRequestPriority,
} from '../api/helpRequests'
import { ApiError } from '../api/client'
import type { Employee } from '../data/employee'

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
  const titleId = useId()
  const errorId = useId()
  const [subject, setSubject] = useState('')
  const [question, setQuestion] = useState('')
  const [priority, setPriority] = useState<HelpRequestPriority>('normal')
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

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
    <Box
      component="form"
      onSubmit={(event: FormEvent<HTMLFormElement>) => {
        void handleSubmit(event)
      }}
      sx={{ display: 'flex', flexDirection: 'column', minHeight: 0 }}
    >
      <DialogTitle component="div" sx={{ pb: 1 }}>
        <Typography variant="overline" color="primary" sx={{ display: 'block' }}>
          Help request
        </Typography>
        <Typography variant="h2" id={titleId}>
          Request help from {employee.name}
        </Typography>
      </DialogTitle>

      <DialogContent dividers>
        <Stack spacing={2}>
          <TextField
            label="Subject"
            value={subject}
            onChange={(event) => setSubject(event.target.value)}
            required
            autoFocus
            disabled={saving}
            autoComplete="off"
            slotProps={{ htmlInput: { maxLength: 160 } }}
          />

          <TextField
            label="Question"
            value={question}
            onChange={(event) => setQuestion(event.target.value)}
            multiline
            minRows={5}
            required
            disabled={saving}
            slotProps={{ htmlInput: { maxLength: 4000 } }}
          />

          <FormControl component="fieldset" disabled={saving}>
            <FormLabel component="legend">Priority</FormLabel>
            <RadioGroup
              row
              name="help-priority"
              value={priority}
              onChange={(event) =>
                setPriority(event.target.value as HelpRequestPriority)
              }
            >
              {priorities.map((option) => (
                <FormControlLabel
                  key={option.value}
                  value={option.value}
                  control={<Radio size="small" />}
                  label={option.label}
                />
              ))}
            </RadioGroup>
          </FormControl>

          {error ? (
            <Alert severity="error" id={errorId}>
              {error}
            </Alert>
          ) : null}
        </Stack>
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 1.5 }}>
        <Button type="button" onClick={onClose} disabled={saving}>
          Cancel
        </Button>
        <Button type="submit" variant="contained" disabled={saving}>
          {saving ? 'Sending…' : 'Send request'}
        </Button>
      </DialogActions>
    </Box>
  )
}

function RequestHelpDialog({
  employee,
  recipientEmployeeId,
  onClose,
  onCreated,
}: RequestHelpDialogProps) {
  const open = Boolean(employee && recipientEmployeeId)

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="sm"
      scroll="paper"
      aria-label="Request help"
      transitionDuration={{ enter: 150, exit: 0 }}
    >
      {employee && recipientEmployeeId ? (
        <RequestHelpForm
          key={`${employee.id}-${recipientEmployeeId}`}
          employee={employee}
          recipientEmployeeId={recipientEmployeeId}
          onClose={onClose}
          onCreated={onCreated}
        />
      ) : null}
    </Dialog>
  )
}

export default RequestHelpDialog
