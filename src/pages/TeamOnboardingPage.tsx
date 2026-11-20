import { useEffect, useState } from 'react'
import { Link as RouterLink } from 'react-router-dom'
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  LinearProgress,
  List,
  ListItemButton,
  ListItemText,
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
          title="Team onboarding"
          description="Sign in as a manager to track assigned new hires."
        />
      </Box>
    )
  }

  return (
    <Box component="main">
      <PageHeader
        eyebrow="Manager"
        title="Team onboarding"
        description="Review progress, overdue work, and manage tasks for new hires assigned to you. Buddy assignment alone does not unlock this view."
        actions={
          <Button component={RouterLink} to="/directory" variant="outlined">
            Back to directory
          </Button>
        }
      />

      {loading ? (
        <Stack direction="row" spacing={1} sx={{ mb: 2, alignItems: 'center' }}>
          <CircularProgress size={18} />
          <Typography variant="body2">Loading managed plans…</Typography>
        </Stack>
      ) : null}
      {error ? (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      ) : null}
      {!loading && !error && plans.length === 0 ? (
        <Paper sx={{ p: 3, textAlign: 'center' }}>
          <Typography variant="subtitle1">No managed plans</Typography>
          <Typography variant="body2">
            You are not assigned as manager on any onboarding plans yet.
          </Typography>
        </Paper>
      ) : null}

      {plans.length > 0 ? (
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} sx={{ alignItems: 'flex-start' }}>
          <Paper
            component="section"
            aria-label="New hires"
            sx={{ width: { xs: '100%', md: 300 }, flexShrink: 0 }}
          >
            <List disablePadding>
              {plans.map((plan) => (
                <ListItemButton
                  key={plan.id}
                  selected={selectedId === plan.id}
                  onClick={() => setSelectedId(plan.id)}
                  sx={{ display: 'block' }}
                >
                  <ListItemText
                    primary={plan.employee?.name ?? 'New hire'}
                    secondary={`${plan.progress.percent}% · ${plan.progress.remaining} left${
                      plan.progress.overdue > 0
                        ? ` · ${plan.progress.overdue} overdue`
                        : ''
                    }`}
                    slotProps={{ primary: { sx: { fontWeight: 600 } } }}
                  />
                  <LinearProgress
                    variant="determinate"
                    value={plan.progress.percent}
                    aria-label={`Onboarding progress for ${plan.employee?.name ?? 'New hire'}`}
                    sx={{ mt: 0.75, height: 6, borderRadius: 3 }}
                  />
                </ListItemButton>
              ))}
            </List>
          </Paper>

          <Box component="section" aria-live="polite" sx={{ flex: 1, minWidth: 0, width: '100%' }}>
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
              <Typography variant="body2">
                Select a new hire to review their plan.
              </Typography>
            )}
          </Box>
        </Stack>
      ) : null}
    </Box>
  )
}

export default TeamOnboardingPage
