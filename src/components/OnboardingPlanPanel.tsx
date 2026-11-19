import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
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
import './OnboardingPlanPanel.css'

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
  if (!employee) return <span>Unassigned</span>
  return (
    <Link
      to="/directory"
      state={{ focusEmployeeId: employee.employeeCode }}
      className="onboarding-panel__profile-link"
    >
      {employee.name}
    </Link>
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

  return (
    <article className="onboarding-panel">
      <header className="onboarding-panel__header">
        <div>
          <p className="onboarding-panel__eyebrow">Onboarding plan</p>
          <h2>{plan.employee?.name ?? 'New hire'}</h2>
          <p>
            Starts {formatDate(plan.startDate)} · {plan.progress.percent}% complete
            · {plan.progress.remaining} remaining
            {plan.progress.overdue > 0
              ? ` · ${plan.progress.overdue} overdue`
              : ''}
          </p>
        </div>
        <div
          className="onboarding-panel__progress"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={plan.progress.percent}
          aria-label="Onboarding completion"
        >
          <span style={{ width: `${plan.progress.percent}%` }} />
        </div>
      </header>

      <dl className="onboarding-panel__people">
        <div>
          <dt>Manager</dt>
          <dd>
            <ProfileLink employee={plan.manager} />
          </dd>
        </div>
        <div>
          <dt>Buddy</dt>
          <dd>
            <ProfileLink employee={plan.buddy} />
          </dd>
        </div>
        <div>
          <dt>Key contacts</dt>
          <dd>
            {plan.keyContacts.filter(Boolean).length === 0 ? (
              <span>None listed</span>
            ) : (
              <ul>
                {plan.keyContacts.map((contact) =>
                  contact ? (
                    <li key={contact.id}>
                      <ProfileLink employee={contact} />
                    </li>
                  ) : null,
                )}
              </ul>
            )}
          </dd>
        </div>
      </dl>

      {error ? (
        <p className="onboarding-panel__error" role="alert">
          {error}
        </p>
      ) : null}

      <ul className="onboarding-panel__tasks">
        {plan.tasks.map((task) => {
          const overdue =
            !task.completedAt &&
            Boolean(task.dueDate) &&
            new Date(task.dueDate!).getTime() < nowMs
          const busy = savingTaskId === task.id

          return (
            <li
              key={task.id}
              className={[
                'onboarding-panel__task',
                task.completedAt ? 'is-complete' : '',
                overdue ? 'is-overdue' : '',
              ]
                .filter(Boolean)
                .join(' ')}
            >
              {editingTaskId === task.id ? (
                <form
                  className="onboarding-panel__edit"
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
                  <label>
                    <span>Title</span>
                    <input
                      value={editTitle}
                      onChange={(event) => setEditTitle(event.target.value)}
                      required
                      disabled={busy}
                    />
                  </label>
                  <label>
                    <span>Instructions</span>
                    <textarea
                      value={editInstructions}
                      onChange={(event) =>
                        setEditInstructions(event.target.value)
                      }
                      rows={2}
                      disabled={busy}
                    />
                  </label>
                  <label>
                    <span>Due date</span>
                    <input
                      type="date"
                      value={editDueDate}
                      onChange={(event) => setEditDueDate(event.target.value)}
                      disabled={busy}
                    />
                  </label>
                  <label>
                    <span>Responsible</span>
                    <select
                      value={editResponsible}
                      onChange={(event) =>
                        setEditResponsible(
                          event.target.value as TaskResponsible,
                        )
                      }
                      disabled={busy}
                    >
                      <option value="new_hire">New hire</option>
                      <option value="manager">Manager</option>
                    </select>
                  </label>
                  <div className="onboarding-panel__actions">
                    <button type="submit" disabled={busy}>
                      {busy ? 'Saving…' : 'Save task'}
                    </button>
                    <button
                      type="button"
                      className="is-secondary"
                      disabled={busy}
                      onClick={() => setEditingTaskId(null)}
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              ) : (
                <>
                  <div className="onboarding-panel__task-main">
                    <strong>{task.title}</strong>
                    <p>
                      Due {formatDate(task.dueDate)} · Owner:{' '}
                      {task.responsible === 'new_hire' ? 'New hire' : 'Manager'}
                      {task.completedAt
                        ? ` · Done by ${task.completedByName ?? 'teammate'} on ${formatDate(task.completedAt)}`
                        : ''}
                    </p>
                    {task.instructions ? <p>{task.instructions}</p> : null}
                  </div>
                  <div className="onboarding-panel__actions">
                    {canToggle(task.responsible) ? (
                      <button
                        type="button"
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
                      </button>
                    ) : null}
                    {canManageTasks ? (
                      <button
                        type="button"
                        className="is-secondary"
                        disabled={busy}
                        onClick={() => startEdit(task.id)}
                      >
                        Edit
                      </button>
                    ) : null}
                  </div>
                </>
              )}
            </li>
          )
        })}
      </ul>

      {canManageTasks ? (
        <form className="onboarding-panel__add" onSubmit={(event) => void handleAdd(event)}>
          <h3>Add task</h3>
          <label>
            <span>Title</span>
            <input
              value={newTitle}
              onChange={(event) => setNewTitle(event.target.value)}
              required
              disabled={adding}
            />
          </label>
          <label>
            <span>Instructions</span>
            <textarea
              value={newInstructions}
              onChange={(event) => setNewInstructions(event.target.value)}
              rows={2}
              disabled={adding}
            />
          </label>
          <label>
            <span>Due date</span>
            <input
              type="date"
              value={newDueDate}
              onChange={(event) => setNewDueDate(event.target.value)}
              disabled={adding}
            />
          </label>
          <label>
            <span>Responsible</span>
            <select
              value={newResponsible}
              onChange={(event) =>
                setNewResponsible(event.target.value as TaskResponsible)
              }
              disabled={adding}
            >
              <option value="new_hire">New hire</option>
              <option value="manager">Manager</option>
            </select>
          </label>
          <button type="submit" disabled={adding || !newTitle.trim()}>
            {adding ? 'Adding…' : 'Add task'}
          </button>
        </form>
      ) : null}
    </article>
  )
}

export default OnboardingPlanPanel
