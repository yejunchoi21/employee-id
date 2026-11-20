import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { Link as RouterLink } from 'react-router-dom'
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  FormControl,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  Tab,
  Tabs,
  TextField,
  Typography,
} from '@mui/material'
import { ApiError } from '../api/client'
import {
  cancelEquipmentRequest,
  createEquipmentRequest,
  fetchEquipmentRequests,
  fetchMyEquipmentAssignments,
  type EquipmentAssignmentDto,
  type EquipmentCategory,
  type EquipmentRequestDto,
} from '../api/equipment'
import PageHeader from '../components/PageHeader'
import StatusChip from '../components/StatusChip'
import { useAuth } from '../hooks/useAuth'

const categories: Array<{ value: EquipmentCategory; label: string }> = [
  { value: 'laptop', label: 'Laptop' },
  { value: 'monitor', label: 'Monitor' },
  { value: 'headset', label: 'Headset' },
  { value: 'other', label: 'Other' },
]

function formatWhen(value: string | null) {
  if (!value) return '—'
  try {
    return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' }).format(
      new Date(value),
    )
  } catch {
    return value
  }
}

function EquipmentPage() {
  const { membership, isAuthLoading } = useAuth()
  const [tab, setTab] = useState<'equipment' | 'requests'>('equipment')
  const [assignments, setAssignments] = useState<EquipmentAssignmentDto[]>([])
  const [requests, setRequests] = useState<EquipmentRequestDto[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [category, setCategory] = useState<EquipmentCategory>('laptop')
  const [reason, setReason] = useState('')
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState<string | null>(null)
  const [cancellingId, setCancellingId] = useState<string | null>(null)
  const [listEpoch, setListEpoch] = useState(0)

  const reload = useCallback(() => {
    setListEpoch((value) => value + 1)
  }, [])

  useEffect(() => {
    if (!membership || membership.mustChangePassword) return

    let cancelled = false
    async function load() {
      setLoading(true)
      setError(null)
      try {
        const [mine, mineRequests] = await Promise.all([
          fetchMyEquipmentAssignments(false),
          fetchEquipmentRequests('mine'),
        ])
        if (cancelled) return
        setAssignments(mine.assignments)
        setRequests(mineRequests.requests)
      } catch (err) {
        if (cancelled) return
        setError(
          err instanceof ApiError
            ? err.message
            : 'Could not load your equipment.',
        )
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void load()
    return () => {
      cancelled = true
    }
  }, [membership, listEpoch])

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
          title="Equipment"
          description="Sign in from the sidebar to view assigned gear and submit requests."
        />
      </Box>
    )
  }

  const handleRequest = async (event: FormEvent) => {
    event.preventDefault()
    if (saving) return
    setSaving(true)
    setError(null)
    setSuccess(null)
    try {
      await createEquipmentRequest({ category, reason: reason.trim() })
      setReason('')
      setSuccess('Request submitted. It starts as Pending.')
      setTab('requests')
      reload()
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : 'Could not submit request.',
      )
    } finally {
      setSaving(false)
    }
  }

  const active = assignments.filter((assignment) => assignment.active)
  const history = assignments.filter((assignment) => !assignment.active)

  return (
    <Box component="main">
      <PageHeader
        eyebrow="Assets"
        title="Equipment"
        description="Review assigned gear and submit requests for a laptop, monitor, headset, or other item. Pending requests can be cancelled anytime."
        actions={
          <Button component={RouterLink} to="/directory" variant="outlined">
            Open directory
          </Button>
        }
      />

      <Tabs
        value={tab}
        onChange={(_, value: 'equipment' | 'requests') => setTab(value)}
        aria-label="Equipment"
        sx={{ mb: 2 }}
      >
        <Tab value="equipment" label="My equipment" />
        <Tab value="requests" label="My requests" />
      </Tabs>

      {loading ? (
        <Stack direction="row" spacing={1} sx={{ mb: 2, alignItems: 'center' }}>
          <CircularProgress size={18} />
          <Typography variant="body2">Loading…</Typography>
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

      {tab === 'equipment' ? (
        <Stack spacing={2}>
          <Typography variant="h3" component="h2">
            Currently assigned
          </Typography>
          {active.length === 0 ? (
            <Paper sx={{ p: 3, textAlign: 'center' }}>
              <Typography variant="subtitle1">No equipment assigned</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1, mb: 2 }}>
                Nothing is checked out to you right now. Open My requests to ask for a
                laptop, monitor, headset, or other item.
              </Typography>
              <Button variant="contained" onClick={() => setTab('requests')}>
                Request equipment
              </Button>
            </Paper>
          ) : (
            <Stack spacing={1}>
              {active.map((assignment) => (
                <Paper key={assignment.id} sx={{ p: 2 }}>
                  <Typography variant="subtitle2">
                    {assignment.item?.name ?? 'Equipment'} (
                    {assignment.item?.assetTag ?? 'n/a'})
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {assignment.item?.category ?? 'item'} · Issued{' '}
                    {formatWhen(assignment.issuedAt)}
                    {assignment.expectedReturnAt
                      ? ` · Expected back ${formatWhen(assignment.expectedReturnAt)}`
                      : ''}
                  </Typography>
                  {assignment.item?.serialNumber ? (
                    <Typography variant="caption" sx={{ display: 'block' }}>
                      Serial {assignment.item.serialNumber}
                    </Typography>
                  ) : null}
                </Paper>
              ))}
            </Stack>
          )}

          <Typography variant="h3" component="h2">
            Past assignments
          </Typography>
          {history.length === 0 ? (
            <Typography variant="body2" color="text.secondary">
              No returned equipment yet.
            </Typography>
          ) : (
            <Stack spacing={1}>
              {history.map((assignment) => (
                <Paper key={assignment.id} sx={{ p: 2 }}>
                  <Typography variant="subtitle2">
                    {assignment.item?.name ?? 'Equipment'} (
                    {assignment.item?.assetTag ?? 'n/a'})
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Returned {formatWhen(assignment.returnedAt)} ·{' '}
                    {assignment.returnCondition ?? 'condition n/a'}
                  </Typography>
                </Paper>
              ))}
            </Stack>
          )}
        </Stack>
      ) : (
        <Stack spacing={2}>
          <Paper
            component="form"
            onSubmit={(event) => {
              void handleRequest(event)
            }}
            sx={{ p: 2 }}
          >
            <Typography variant="subtitle1" sx={{ mb: 1.5 }}>
              New request
            </Typography>
            <Stack spacing={2}>
              <FormControl required disabled={saving}>
                <InputLabel id="item-type-label">Item type</InputLabel>
                <Select
                  labelId="item-type-label"
                  label="Item type"
                  value={category}
                  onChange={(event) =>
                    setCategory(event.target.value as EquipmentCategory)
                  }
                >
                  {categories.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <TextField
                label="Reason"
                multiline
                minRows={3}
                required
                value={reason}
                onChange={(event) => setReason(event.target.value)}
                disabled={saving}
              />
              <Button type="submit" variant="contained" disabled={saving}>
                {saving ? 'Submitting…' : 'Submit request'}
              </Button>
            </Stack>
          </Paper>

          <Typography variant="h3" component="h2">
            Request history
          </Typography>
          {requests.length === 0 ? (
            <Paper sx={{ p: 3, textAlign: 'center' }}>
              <Typography variant="subtitle1">No requests yet</Typography>
              <Typography variant="body2" color="text.secondary">
                Use the form above to request gear. Approvals and admin responses will
                appear here.
              </Typography>
            </Paper>
          ) : (
            <Stack spacing={1}>
              {requests.map((request) => (
                <Paper key={request.id} sx={{ p: 2 }}>
                  <Stack
                    direction="row"
                    spacing={1}
                    useFlexGap
                    sx={{
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      flexWrap: 'wrap',
                    }}
                  >
                    <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                      <Typography variant="subtitle2" sx={{ textTransform: 'capitalize' }}>
                        {request.category}
                      </Typography>
                      <StatusChip status={request.status} />
                    </Stack>
                    {request.status === 'pending' ? (
                      <Button
                        size="small"
                        variant="outlined"
                        disabled={cancellingId === request.id}
                        onClick={() => {
                          void (async () => {
                            setCancellingId(request.id)
                            setError(null)
                            try {
                              await cancelEquipmentRequest(request.id)
                              reload()
                            } catch (err) {
                              setError(
                                err instanceof ApiError
                                  ? err.message
                                  : 'Could not cancel request.',
                              )
                            } finally {
                              setCancellingId(null)
                            }
                          })()
                        }}
                      >
                        {cancellingId === request.id ? 'Cancelling…' : 'Cancel'}
                      </Button>
                    ) : null}
                  </Stack>
                  <Typography variant="body2" sx={{ mt: 0.5 }}>
                    {request.reason}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                    Submitted {formatWhen(request.createdAt)}
                  </Typography>
                  {request.adminResponse ? (
                    <Typography variant="body2" sx={{ mt: 0.5 }}>
                      Admin response: {request.adminResponse}
                    </Typography>
                  ) : null}
                </Paper>
              ))}
            </Stack>
          )}
        </Stack>
      )}
    </Box>
  )
}

export default EquipmentPage