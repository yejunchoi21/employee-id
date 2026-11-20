import { useState, type FormEvent, type ReactNode } from 'react'
import { Link as RouterLink } from 'react-router-dom'
import {
  Alert,
  Box,
  Button,
  Chip,
  LinearProgress,
  Link,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import { ApiError } from '../api/client'
import {
  addOnboardingTask,
  completeOnboardingTask,
  reopenOnboardingTask,
  updateOnboardingTask,
  type OnboardingEmployeeBrief,
  type OnboardingPlanDto,
  type TaskResponsible,
} from '../api/onboarding'

function formatDate(value: string | null) {
  if (!value) return 'No due date'
  try {
    return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' }).format(
      new Date(value),
    )
  } catch {
    return value
  }
}

function ProfileLink({
  employee,
}: {
  employee: OnboardingEmployeeBrief | null | undefined
}) {
  if (!employee) {
    return (
      <Typography variant="body2" component="span">
        Unassigned
      </Typography>
    )
  }
  return (
    <Link
      component={RouterLink}
      to="/directory"
      state={{ focusEmployeeId: employee.employeeCode }}
      underline="hover"
      variant="body2"
    >
      {employee.name}
    </Link>
  )
}

function PersonBlock({
  label,
  children,
}: {
  label: string
  children: ReactNode
}) {
  return (
    <Box>
      <Typography variant="overline" color="text.secondary" component="div">
        {label}
      </Typography>
      {children}
    </Box>
  )
}

interface OnboardingPlanPanelProps {
  plan: OnboardingPlanDto
  viewerRole: 'admin' | 'new_hire' | 'manager'
  onPlanChange: (plan: OnboardingPlanDto) => void
}

function OnboardingPlanPanel({
  plan,
  viewerRole,
  onPlanChange,
}: OnboardingPlanPanelProps) {
  const canManageTasks = viewerRole === 'admin' || viewerRole === 'manager'
  const [nowMs] = useState(() => Date.now())
  const [error, setError] = useState<string | null>(null)
  const [savingTaskId, setSavingTaskId] = useState<string | null>(null)
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const [editInstructions, setEditInstructions] = useState('')
  const [editDueDate, setEditDueDate] = useState('')
  const [editResponsible, setEditResponsible] =
    useState<TaskResponsible>('new_hire')
  const [newTitle, setNewTitle] = useState('')
  const [newInstructions, setNewInstructions] = useState('')
  const [newDueDate, setNewDueDate] = useState('')
  const [newResponsible, setNewResponsible] =
    useState<TaskResponsible>('new_hire')
  const [adding, setAdding] = useState(false)

  const run = async (taskId: string | null, action: () => Promise<OnboardingPlanDto>) => {
    setSavingTaskId(taskId ?? 'new')
    setError(null)
    try {
      const next = await action()
      onPlanChange(next)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not update task.')
    } finally {
      setSavingTaskId(null)
    }
  }

  const canToggle = (responsible: TaskResponsible) => {
    if (viewerRole === 'admin') return true
    if (viewerRole === 'new_hire' && responsible === 'new_hire') return true
    if (viewerRole === 'manager' && responsible === 'manager') return true
    return false
  }

  const startEdit = (taskId: string) => {
    const task = plan.tasks.find((item) => item.id === taskId)
    if (!task) return
    setEditingTaskId(taskId)
    setEditTitle(task.title)
    setEditInstructions(task.instructions ?? '')
    setEditDueDate(task.dueDate ? task.dueDate.slice(0, 10) : '')
    setEditResponsible(task.responsible)
  }

  const handleAdd = async (event: FormEvent) => {
    event.preventDefault()
    if (!newTitle.trim()) return
    setAdding(true)
    await run(null, async () => {
      const result = await addOnboardingTask(plan.id, {
        title: newTitle.trim(),
        instructions: newInstructions.trim() || null,
        dueDate: newDueDate || null,
        responsible: newResponsible,
      })
      setNewTitle('')
      setNewInstructions('')
      setNewDueDate('')
      setNewResponsible('new_hire')
      return result.plan
    })
    setAdding(false)
  }

  const contacts = plan.keyContacts.filter(
    (contact): contact is OnboardingEmployeeBrief => Boolean(contact),
  )

  return (
    <Paper component="article" sx={{ p: 2 }}>
      <Stack spacing={2}>
        <Box>
          <Typography variant="overline" color="primary" sx={{ display: 'block' }}>
            Onboarding plan
          </Typography>
          <Typography variant="h2">{plan.employee?.name ?? 'New hire'}</Typography>
          <Typography variant="body2" sx={{ mt: 0.5 }}>
            Starts {formatDate(plan.startDate)} · {plan.progress.percent}% complete
            · {plan.progress.remaining} remaining
            {plan.progress.overdue > 0
              ? ` · ${plan.progress.overdue} overdue`
              : ''}
          </Typography>
          <LinearProgress
            variant="determinate"
            value={plan.progress.percent}
            aria-label="Onboarding completion"
            sx={{ mt: 1.5, height: 8, borderRadius: 4 }}
          />
        </Box>

        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          spacing={{ xs: 1.5, sm: 4 }}
          component="dl"
          sx={{ m: 0 }}
        >
          <PersonBlock label="Manager">
            <ProfileLink employee={plan.manager} />
          </PersonBlock>
          <PersonBlock label="Buddy">
            <ProfileLink employee={plan.buddy} />
          </PersonBlock>
          <PersonBlock label="Key contacts">
            {contacts.length === 0 ? (
              <Typography variant="body2">None listed</Typography>
            ) : (
              <Stack spacing={0.25}>
                {contacts.map((contact) => (
                  <ProfileLink key={contact.id} employee={contact} />
                ))}
              </Stack>
            )}
          </PersonBlock>
        </Stack>

        {error ? <Alert severity="error">{error}</Alert> : null}

        <Stack spacing={1} component="ul" sx={{ listStyle: 'none', m: 0, p: 0 }}>
          {plan.tasks.map((task) => {
            const overdue =
              !task.completedAt &&
              Boolean(task.dueDate) &&
              new Date(task.dueDate!).getTime() < nowMs
            const busy = savingTaskId === task.id

            return (
              <Paper
                key={task.id}
                component="li"
                sx={{
                  p: 1.5,
                  bgcolor: task.completedAt ? 'action.hover' : 'background.paper',
                  borderColor: overdue ? 'error.main' : undefined,
                }}
              >
                {editingTaskId === task.id ? (
                  <Stack
                    component="form"
                    spacing={1.5}
                    onSubmit={(event) => {
                      event.preventDefault()
                      void run(task.id, async () => {
                        const result = await updateOnboardingTask(
                          plan.id,
                          task.id,
                          {
                            title: editTitle.trim(),
                            instructions: editInstructions.trim() || null,
                            dueDate: editDueDate || null,
                            responsible: editResponsible,
                          },
                        )
                        setEditingTaskId(null)
                        return result.plan
                      })
                    }}
                  >
                    <TextField
                      label="Title"
                      value={editTitle}
                      onChange={(event) => setEditTitle(event.target.value)}
                      required
                      disabled={busy}
                    />
                    <TextField
                      label="Instructions"
                      value={editInstructions}
                      onChange={(event) => setEditInstructions(event.target.value)}
                      multiline
                      minRows={2}
                      disabled={busy}
                    />
                    <TextField
                      label="Due date"
                      type="date"
                      value={editDueDate}
                      onChange={(event) => setEditDueDate(event.target.value)}
                      disabled={busy}
                      slotProps={{ inputLabel: { shrink: true } }}
                    />
                    <TextField
                      select
                      label="Responsible"
                      value={editResponsible}
                      onChange={(event) =>
                        setEditResponsible(event.target.value as TaskResponsible)
                      }
                      disabled={busy}
                    >
                      <MenuItem value="new_hire">New hire</MenuItem>
                      <MenuItem value="manager">Manager</MenuItem>
                    </TextField>
                    <Stack direction="row" spacing={1}>
                      <Button type="submit" variant="contained" disabled={busy}>
                        {busy ? 'Saving…' : 'Save task'}
                      </Button>
                      <Button
                        type="button"
                        variant="outlined"
                        disabled={busy}
                        onClick={() => setEditingTaskId(null)}
                      >
                        Cancel
                      </Button>
                    </Stack>
                  </Stack>
                ) : (
                  <Stack
                    direction={{ xs: 'column', sm: 'row' }}
                    spacing={1.5}
                    sx={{
                      justifyContent: 'space-between',
                      alignItems: { xs: 'stretch', sm: 'flex-start' },
                    }}
                  >
                    <Box sx={{ minWidth: 0 }}>
                      <Stack
                        direction="row"
                        spacing={1}
                        useFlexGap
                        sx={{ alignItems: 'center', flexWrap: 'wrap' }}
                      >
                        <Typography
                          variant="subtitle1"
                          sx={{
                            textDecoration: task.completedAt
                              ? 'line-through'
                              : 'none',
                          }}
                        >
                          {task.title}
                        </Typography>
                        {task.completedAt ? (
                          <Chip size="small" color="success" label="Done" />
                        ) : null}
                        {overdue ? (
                          <Chip size="small" color="error" label="Overdue" />
                        ) : null}
                      </Stack>
                      <Typography variant="body2">
                        Due {formatDate(task.dueDate)} · Owner:{' '}
                        {task.responsible === 'new_hire' ? 'New hire' : 'Manager'}
                        {task.completedAt
                          ? ` · Done by ${task.completedByName ?? 'teammate'} on ${formatDate(task.completedAt)}`
                          : ''}
                      </Typography>
                      {task.instructions ? (
                        <Typography variant="body2" sx={{ mt: 0.5 }}>
                          {task.instructions}
                        </Typography>
                      ) : null}
                    </Box>
                    <Stack direction="row" spacing={1} sx={{ flexShrink: 0 }}>
                      {canToggle(task.responsible) ? (
                        <Button
                          type="button"
                          size="small"
                          variant="contained"
                          disabled={busy}
                          onClick={() =>
                            void run(task.id, async () => {
                              const result = task.completedAt
                                ? await reopenOnboardingTask(plan.id, task.id)
                                : await completeOnboardingTask(plan.id, task.id)
                              return result.plan
                            })
                          }
                        >
                          {busy
                            ? 'Saving…'
                            : task.completedAt
                              ? 'Reopen'
                              : 'Mark complete'}
                        </Button>
                      ) : null}
                      {canManageTasks ? (
                        <Button
                          type="button"
                          size="small"
                          variant="outlined"
                          disabled={busy}
                          onClick={() => startEdit(task.id)}
                        >
                          Edit
                        </Button>
                      ) : null}
                    </Stack>
                  </Stack>
                )}
              </Paper>
            )
          })}
        </Stack>

        {canManageTasks ? (
          <Stack
            component="form"
            spacing={1.5}
            onSubmit={(event) => void handleAdd(event)}
          >
            <Typography variant="h3" component="h3">
              Add task
            </Typography>
            <TextField
              label="Title"
              value={newTitle}
              onChange={(event) => setNewTitle(event.target.value)}
              required
              disabled={adding}
            />
            <TextField
              label="Instructions"
              value={newInstructions}
              onChange={(event) => setNewInstructions(event.target.value)}
              multiline
              minRows={2}
              disabled={adding}
            />
            <TextField
              label="Due date"
              type="date"
              value={newDueDate}
              onChange={(event) => setNewDueDate(event.target.value)}
              disabled={adding}
              slotProps={{ inputLabel: { shrink: true } }}
            />
            <TextField
              select
              label="Responsible"
              value={newResponsible}
              onChange={(event) =>
                setNewResponsible(event.target.value as TaskResponsible)
              }
              disabled={adding}
            >
              <MenuItem value="new_hire">New hire</MenuItem>
              <MenuItem value="manager">Manager</MenuItem>
            </TextField>
            <Box>
              <Button
                type="submit"
                variant="contained"
                disabled={adding || !newTitle.trim()}
              >
                {adding ? 'Adding…' : 'Add task'}
              </Button>
            </Box>
          </Stack>
        ) : null}
      </Stack>
    </Paper>
  )
}

export default OnboardingPlanPanel
