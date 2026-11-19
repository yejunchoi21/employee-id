import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { ApiError } from '../api/client'
import { fetchPublishedEmployees } from '../api/helpRequests'
import {
  createOnboardingPlan,
  fetchOnboardingDefaults,
  fetchOnboardingPlans,
  type OnboardingPlanDto,
} from '../api/onboarding'
import OnboardingPlanPanel from '../components/OnboardingPlanPanel'
import { useAuth } from '../hooks/useAuth'
import './OnboardingPages.css'

interface EmployeeOption {
  id: string
  name: string
  email: string
  title: string
}

function AdminOnboardingPage() {
  const { membership, isAuthLoading } = useAuth()
  const [employees, setEmployees] = useState<EmployeeOption[]>([])
  const [defaults, setDefaults] = useState<
    Array<{ title: string; responsible: string }>
  >([])
  const [plans, setPlans] = useState<OnboardingPlanDto[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [employeeId, setEmployeeId] = useState('')
  const [managerEmployeeId, setManagerEmployeeId] = useState('')
  const [buddyEmployeeId, setBuddyEmployeeId] = useState('')
  const [keyContactEmployeeIds, setKeyContactEmployeeIds] = useState<string[]>(
    [],
  )
  const [startDate, setStartDate] = useState('')
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  useEffect(() => {
    if (!membership || membership.role !== 'admin' || membership.mustChangePassword) {
      return
    }

    let cancelled = false
    async function load() {
      setLoading(true)
      setError(null)
      try {
        const [published, template, allPlans] = await Promise.all([
          fetchPublishedEmployees(),
          fetchOnboardingDefaults(),
          fetchOnboardingPlans('all'),
        ])
        if (cancelled) return
        setEmployees(
          published.employees.map((employee) => ({
            id: employee.id,
            name: employee.name,
            email: employee.email,
            title: employee.title,
          })),
        )
        setDefaults(template.tasks)
        setPlans(allPlans.plans)
        setSelectedId((current) => current ?? allPlans.plans[0]?.id ?? null)
        setEmployeeId((current) => current || published.employees[0]?.id || '')
        setManagerEmployeeId(
          (current) => current || published.employees[1]?.id || '',
        )
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof ApiError
              ? err.message
              : 'Could not load onboarding admin data.',
          )
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void load()
    return () => {
      cancelled = true
    }
  }, [membership])

  const selected = plans.find((plan) => plan.id === selectedId) ?? null

  const employeeOptions = useMemo(
    () =>
      employees.map((employee) => (
        <option key={employee.id} value={employee.id}>
          {employee.name} · {employee.title}
        </option>
      )),
    [employees],
  )

  if (isAuthLoading) {
    return (
      <main className="onboarding-page">
        <p className="onboarding-page__status">Checking your session…</p>
      </main>
    )
  }

  if (!membership) {
    return (
      <main className="onboarding-page">
        <header className="onboarding-page__hero">
          <h1>Onboarding admin</h1>
          <p>Sign in as an admin to create onboarding plans.</p>
        </header>
      </main>
    )
  }

  if (membership.role !== 'admin') {
    return <Navigate to="/onboarding" replace />
  }

  const handleCreate = async (event: FormEvent) => {
    event.preventDefault()
    if (saving) return
    setSaving(true)
    setError(null)
    setSuccess(null)
    try {
      const result = await createOnboardingPlan({
        employeeId,
        managerEmployeeId,
        buddyEmployeeId: buddyEmployeeId || null,
        keyContactEmployeeIds,
        startDate,
      })
      setPlans((current) => [result.plan, ...current])
      setSelectedId(result.plan.id)
      setSuccess(
        `Created onboarding plan for ${result.plan.employee?.name ?? 'new hire'}.`,
      )
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : 'Could not create the onboarding plan.',
      )
    } finally {
      setSaving(false)
    }
  }

  const toggleContact = (id: string) => {
    setKeyContactEmployeeIds((current) =>
      current.includes(id)
        ? current.filter((item) => item !== id)
        : [...current, id],
    )
  }

  return (
    <main className="onboarding-page">
      <header className="onboarding-page__hero">
        <div>
          <p className="onboarding-page__eyebrow">Admin</p>
          <h1>Onboarding plans</h1>
          <p>
            Create a plan for an active employee. Default checklist tasks are
            copied into the plan so later edits stay local.
          </p>
        </div>
        <Link to="/directory">Back to directory</Link>
      </header>

      {loading ? (
        <p className="onboarding-page__status">Loading admin tools…</p>
      ) : null}
      {error ? (
        <p className="onboarding-page__error" role="alert">
          {error}
        </p>
      ) : null}
      {success ? (
        <p className="onboarding-page__success" role="status">
          {success}
        </p>
      ) : null}

      <form
        className="onboarding-page__form"
        onSubmit={(event) => {
          void handleCreate(event)
        }}
      >
        <fieldset disabled={saving || loading}>
          <legend>Create plan</legend>
          <label>
            <span>New hire</span>
            <select
              value={employeeId}
              onChange={(event) => setEmployeeId(event.target.value)}
              required
            >
              {employeeOptions}
            </select>
          </label>
          <label>
            <span>Manager</span>
            <select
              value={managerEmployeeId}
              onChange={(event) => setManagerEmployeeId(event.target.value)}
              required
            >
              {employeeOptions}
            </select>
          </label>
          <label>
            <span>Buddy (optional)</span>
            <select
              value={buddyEmployeeId}
              onChange={(event) => setBuddyEmployeeId(event.target.value)}
            >
              <option value="">None</option>
              {employeeOptions}
            </select>
          </label>
          <label>
            <span>Start date</span>
            <input
              type="date"
              value={startDate}
              onChange={(event) => setStartDate(event.target.value)}
              required
            />
          </label>
          <fieldset className="onboarding-page__contacts">
            <legend>Key contacts</legend>
            {employees.map((employee) => (
              <label key={employee.id} className="onboarding-page__check">
                <input
                  type="checkbox"
                  checked={keyContactEmployeeIds.includes(employee.id)}
                  onChange={() => toggleContact(employee.id)}
                />
                {employee.name}
              </label>
            ))}
          </fieldset>
          <p className="onboarding-page__hint">
            Default checklist ({defaults.length} tasks):{' '}
            {defaults.map((task) => task.title).join(' · ')}
          </p>
          <button type="submit">{saving ? 'Creating…' : 'Create plan'}</button>
        </fieldset>
      </form>

      {plans.length > 0 ? (
        <div className="onboarding-page__layout">
          <section className="onboarding-page__list" aria-label="All plans">
            <ul>
              {plans.map((plan) => (
                <li key={plan.id}>
                  <button
                    type="button"
                    className={
                      selectedId === plan.id
                        ? 'onboarding-page__item is-selected'
                        : 'onboarding-page__item'
                    }
                    onClick={() => setSelectedId(plan.id)}
                  >
                    <strong>{plan.employee?.name ?? 'New hire'}</strong>
                    <span>
                      Manager {plan.manager?.name ?? 'n/a'} ·{' '}
                      {plan.progress.percent}%
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </section>
          <section>
            {selected ? (
              <OnboardingPlanPanel
                plan={selected}
                viewerRole="admin"
                onPlanChange={(next) => {
                  setPlans((current) =>
                    current.map((plan) =>
                      plan.id === next.id ? next : plan,
                    ),
                  )
                }}
              />
            ) : null}
          </section>
        </div>
      ) : null}
    </main>
  )
}

export default AdminOnboardingPage
