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

function MyOnboardingPage() {
  const { membership, isAuthLoading } = useAuth()
  const [plan, setPlan] = useState<OnboardingPlanDto | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!membership || membership.mustChangePassword) return

    let cancelled = false
    async function load() {
      setLoading(true)
      setError(null)
      try {
        const result = await fetchOnboardingPlans('mine')
        if (!cancelled) setPlan(result.plans[0] ?? null)
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof ApiError
              ? err.message
              : 'Could not load your onboarding plan.',
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
          <h1>My onboarding</h1>
          <p>Sign in to view your onboarding checklist.</p>
        </header>
      </main>
    )
  }

  return (
    <main className="onboarding-page">
      <header className="onboarding-page__hero">
        <div>
          <p className="onboarding-page__eyebrow">New hire</p>
          <h1>My onboarding</h1>
          <p>
            Track your checklist, due dates, buddy, and key contacts. Complete
            only the tasks assigned to you.
          </p>
        </div>
        <Link to="/directory">Back to directory</Link>
      </header>

      {loading ? (
        <p className="onboarding-page__status">Loading your plan…</p>
      ) : null}
      {error ? (
        <p className="onboarding-page__error" role="alert">
          {error}
        </p>
      ) : null}
      {!loading && !error && !plan ? (
        <p className="onboarding-page__status">
          No onboarding plan has been assigned to your employee profile yet.
        </p>
      ) : null}
      {plan ? (
        <OnboardingPlanPanel
          plan={plan}
          viewerRole="new_hire"
          onPlanChange={setPlan}
        />
      ) : null}
    </main>
  )
}

export default MyOnboardingPage
