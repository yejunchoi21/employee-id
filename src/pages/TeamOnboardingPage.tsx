import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ApiError } from '../api/client'
import {
  fetchOnboardingPlans,
  type OnboardingPlanDto,
} from '../api/onboarding'
import OnboardingPlanPanel from '../components/OnboardingPlanPanel'
import { useAuth } from '../hooks/useAuth'
import './OnboardingPages.css'

function TeamOnboardingPage() {
  const { membership, isAuthLoading } = useAuth()
  const [plans, setPlans] = useState<OnboardingPlanDto[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!membership || membership.mustChangePassword) return

    let cancelled = false
    async function load() {
      setLoading(true)
      setError(null)
      try {
        const result = await fetchOnboardingPlans('managed')
        if (cancelled) return
        setPlans(result.plans)
        setSelectedId((current) => current ?? result.plans[0]?.id ?? null)
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof ApiError
              ? err.message
              : 'Could not load managed onboarding plans.',
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
          <h1>Team onboarding</h1>
          <p>Sign in as a manager to track assigned new hires.</p>
        </header>
      </main>
    )
  }

  return (
    <main className="onboarding-page">
      <header className="onboarding-page__hero">
        <div>
          <p className="onboarding-page__eyebrow">Manager</p>
          <h1>Team onboarding</h1>
          <p>
            Review progress, overdue work, and manage tasks for new hires
            assigned to you. Buddy assignment alone does not unlock this view.
          </p>
        </div>
        <Link to="/directory">Back to directory</Link>
      </header>

      {loading ? (
        <p className="onboarding-page__status">Loading managed plans…</p>
      ) : null}
      {error ? (
        <p className="onboarding-page__error" role="alert">
          {error}
        </p>
      ) : null}
      {!loading && !error && plans.length === 0 ? (
        <p className="onboarding-page__status">
          You are not assigned as manager on any onboarding plans yet.
        </p>
      ) : null}

      {plans.length > 0 ? (
        <div className="onboarding-page__layout">
          <section className="onboarding-page__list" aria-label="New hires">
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
                      {plan.progress.percent}% · {plan.progress.remaining} left
                      {plan.progress.overdue > 0
                        ? ` · ${plan.progress.overdue} overdue`
                        : ''}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </section>

          <section aria-live="polite">
            {selected ? (
              <OnboardingPlanPanel
                plan={selected}
                viewerRole="manager"
                onPlanChange={(next) => {
                  setPlans((current) =>
                    current.map((plan) =>
                      plan.id === next.id ? next : plan,
                    ),
                  )
                }}
              />
            ) : (
              <p className="onboarding-page__status">
                Select a new hire to review their plan.
              </p>
            )}
          </section>
        </div>
      ) : null}
    </main>
  )
}

export default TeamOnboardingPage
