import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { Link as RouterLink, Navigate } from 'react-router-dom'
import {
  Alert,
  Box,
  Button,
  Checkbox,
  CircularProgress,
  FormControl,
  FormControlLabel,
  FormGroup,
  FormLabel,
  LinearProgress,
  List,
  ListItemButton,
  ListItemText,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import { ApiError } from '../api/client'
import { fetchPublishedEmployees } from '../api/helpRequests'
import {
  createOnboardingPlan,
  fetchOnboardingDefaults,
  fetchOnboardingPlans,
  type OnboardingPlanDto,
} from '../api/onboarding'
import OnboardingPlanPanel from '../components/OnboardingPlanPanel'
import PageHeader from '../components/PageHeader'
import { useAuth } from '../hooks/useAuth'

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
        <MenuItem key={employee.id} value={employee.id}>
          {employee.name} · {employee.title}
        </MenuItem>
      )),
    [employees],
  )

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
          title="Onboarding admin"
          description="Sign in as an admin to create onboarding plans."
        />
      </Box>
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
    <Box component="main">
      <PageHeader
        eyebrow="Admin"
        title="Onboarding plans"
        description="Create a plan for an active employee. Default checklist tasks are copied into the plan so later edits stay local."
        actions={
          <Button component={RouterLink} to="/directory" variant="outlined">
            Back to directory
          </Button>
        }
      />

      {loading ? (
        <Stack direction="row" spacing={1} sx={{ mb: 2, alignItems: 'center' }}>
          <CircularProgress size={18} />
          <Typography variant="body2">Loading admin tools…</Typography>
        </Stack>
      ) : null}
      {error ? (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      ) : null}
      {success ? (
        <Alert severity="success" sx={{ mb: 2 }}>
          {success}
        </Alert>
      ) : null}

      <Paper
        component="form"
        onSubmit={(event) => {
          void handleCreate(event)
        }}
        sx={{ p: 2, mb: 2 }}
      >
        <Stack
          component="fieldset"
          spacing={2}
          disabled={saving || loading}
          sx={{ border: 0, m: 0, p: 0, minWidth: 0 }}
        >
          <Typography variant="subtitle1" component="legend" sx={{ mb: 1.5, p: 0 }}>
            Create plan
          </Typography>
          <TextField
            select
            label="New hire"
            value={employeeId}
            onChange={(event) => setEmployeeId(event.target.value)}
            required
          >
            {employeeOptions}
          </TextField>
          <TextField
            select
            label="Manager"
            value={managerEmployeeId}
            onChange={(event) => setManagerEmployeeId(event.target.value)}
            required
          >
            {employeeOptions}
          </TextField>
          <TextField
            select
            label="Buddy (optional)"
            value={buddyEmployeeId}
            onChange={(event) => setBuddyEmployeeId(event.target.value)}
          >
            <MenuItem value="">None</MenuItem>
            {employeeOptions}
          </TextField>
          <TextField
            label="Start date"
            type="date"
            value={startDate}
            onChange={(event) => setStartDate(event.target.value)}
            required
            slotProps={{ inputLabel: { shrink: true } }}
          />
          <FormControl component="fieldset" variant="standard">
            <FormLabel component="legend">Key contacts</FormLabel>
            <FormGroup sx={{ maxHeight: 220, overflowY: 'auto', flexWrap: 'nowrap' }}>
              {employees.map((employee) => (
                <FormControlLabel
                  key={employee.id}
                  label={employee.name}
                  control={
                    <Checkbox
                      size="small"
                      checked={keyContactEmployeeIds.includes(employee.id)}
                      onChange={() => toggleContact(employee.id)}
                    />
                  }
                />
              ))}
            </FormGroup>
          </FormControl>
          <Typography variant="body2">
            Default checklist ({defaults.length} tasks):{' '}
            {defaults.map((task) => task.title).join(' · ')}
          </Typography>
          <Box>
            <Button type="submit" variant="contained" disabled={saving || loading}>
              {saving ? 'Creating…' : 'Create plan'}
            </Button>
          </Box>
        </Stack>
      </Paper>

      {plans.length > 0 ? (
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} sx={{ alignItems: 'flex-start' }}>
          <Paper
            component="section"
            aria-label="All plans"
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
                    secondary={`Manager ${plan.manager?.name ?? 'n/a'} · ${plan.progress.percent}%`}
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
          <Box component="section" sx={{ flex: 1, minWidth: 0, width: '100%' }}>
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
          </Box>
        </Stack>
      ) : null}
    </Box>
  )
}

export default AdminOnboardingPage
