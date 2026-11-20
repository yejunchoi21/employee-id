import { useEffect, useState } from 'react'
import { Link as RouterLink } from 'react-router-dom'
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Paper,
  Stack,
  Typography,
} from '@mui/material'
import { ApiError } from '../api/client'
import {
  fetchOnboardingPlans,
  type OnboardingPlanDto,
} from '../api/onboarding'
import OnboardingPlanPanel from '../components/OnboardingPlanPanel'
import PageHeader from '../components/PageHeader'
import { useAuth } from '../hooks/useAuth'

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
      <Box component="main">
        <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
          <CircularProgress size={18} />
          <Typography variant="body2">Checking your session…</Typography>
        </Stack>
      </Box>
    )
  }

  if (!membership) {
    return (
      <Box component="main">
        <PageHeader
          title="My onboarding"
          description="Sign in to view your onboarding checklist."
        />
      </Box>
    )
  }

  return (
    <Box component="main">
      <PageHeader
        eyebrow="New hire"
        title="My onboarding"
        description="Track your checklist, due dates, buddy, and key contacts. Complete only the tasks assigned to you."
        actions={
          <Button component={RouterLink} to="/directory" variant="outlined">
            Back to directory
          </Button>
        }
      />

      {loading ? (
        <Stack direction="row" spacing={1} sx={{ mb: 2, alignItems: 'center' }}>
          <CircularProgress size={18} />
          <Typography variant="body2">Loading your plan…</Typography>
        </Stack>
      ) : null}
      {error ? (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      ) : null}
      {!loading && !error && !plan ? (
        <Paper sx={{ p: 3, textAlign: 'center' }}>
          <Typography variant="subtitle1">No onboarding plan yet</Typography>
          <Typography variant="body2">
            No onboarding plan has been assigned to your employee profile yet.
          </Typography>
        </Paper>
      ) : null}
      {plan ? (
        <OnboardingPlanPanel
          plan={plan}
          viewerRole="new_hire"
          onPlanChange={setPlan}
        />
      ) : null}
    </Box>
  )
}

export default MyOnboardingPage
