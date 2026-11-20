import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type FormEvent,
} from 'react'
import { Link as RouterLink, Navigate } from 'react-router-dom'
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
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tabs,
  TextField,
  Typography,
} from '@mui/material'
import { ApiError } from '../api/client'
import {
  approveEquipmentRequest,
  assignEquipment,
  createInventoryItem,
  declineEquipmentRequest,
  fetchAllAssignments,
  fetchEquipmentRequests,
  fetchInventoryItems,
  fulfilEquipmentRequest,
  returnEquipment,
  updateInventoryItem,
  type EquipmentAssignmentDto,
  type EquipmentCategory,
  type EquipmentItemDto,
  type EquipmentItemStatus,
  type EquipmentRequestDto,
  type EquipmentReturnCondition,
} from '../api/equipment'
import { fetchPublishedEmployees } from '../api/helpRequests'
import PageHeader from '../components/PageHeader'
import StatusChip from '../components/StatusChip'
import { useAuth } from '../hooks/useAuth'

const categories: EquipmentCategory[] = [
  'laptop',
  'monitor',
  'headset',
  'other',
]
const itemStatuses: EquipmentItemStatus[] = [
  'available',
  'assigned',
  'maintenance',
  'retired',
]

function AdminEquipmentPage() {
  const { membership, isAuthLoading } = useAuth()
  const [tab, setTab] = useState<'inventory' | 'requests' | 'assignments'>(
    'inventory',
  )
  const [items, setItems] = useState<EquipmentItemDto[]>([])
  const [requests, setRequests] = useState<EquipmentRequestDto[]>([])
  const [assignments, setAssignments] = useState<EquipmentAssignmentDto[]>([])
  const [employees, setEmployees] = useState<
    Array<{ id: string; name: string; email: string }>
  >([])
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<
    EquipmentItemStatus | 'all'
  >('all')
  const [categoryFilter, setCategoryFilter] = useState<
    EquipmentCategory | 'all'
  >('all')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const [assetTag, setAssetTag] = useState('')
  const [name, setName] = useState('')
  const [category, setCategory] = useState<EquipmentCategory>('laptop')
  const [serialNumber, setSerialNumber] = useState('')
  const [editId, setEditId] = useState<string | null>(null)

  const [decisionResponse, setDecisionResponse] = useState('')
  const [fulfilItemId, setFulfilItemId] = useState('')
  const [fulfilRequestId, setFulfilRequestId] = useState<string | null>(null)

  const [assignItemId, setAssignItemId] = useState('')
  const [assignEmployeeId, setAssignEmployeeId] = useState('')
  const [issuedAt, setIssuedAt] = useState('')
  const [expectedReturnAt, setExpectedReturnAt] = useState('')

  const [returnAssignmentId, setReturnAssignmentId] = useState<string | null>(
    null,
  )
  const [returnedAt, setReturnedAt] = useState('')
  const [returnCondition, setReturnCondition] =
    useState<EquipmentReturnCondition>('good')
  const [nextItemStatus, setNextItemStatus] = useState<
    'available' | 'maintenance'
  >('available')
  const [returnNotes, setReturnNotes] = useState('')

  const [listEpoch, setListEpoch] = useState(0)

  const availableItems = useMemo(
    () => items.filter((item) => item.status === 'available'),
    [items],
  )

  const reload = useCallback(() => {
    setListEpoch((value) => value + 1)
  }, [])

  useEffect(() => {
    if (
      !membership ||
      membership.role !== 'admin' ||
      membership.mustChangePassword
    ) {
      return
    }

    let cancelled = false
    async function load() {
      setLoading(true)
      setError(null)
      try {
        const [inventory, allRequests, allAssignments, published] =
          await Promise.all([
            fetchInventoryItems({
              search,
              status: statusFilter,
              category: categoryFilter,
            }),
            fetchEquipmentRequests('all'),
            fetchAllAssignments(false),
            fetchPublishedEmployees(),
          ])
        if (cancelled) return
        setItems(inventory.items)
        setRequests(allRequests.requests)
        setAssignments(allAssignments.assignments)
        setEmployees(
          published.employees.map((employee) => ({
            id: employee.id,
            name: employee.name,
            email: employee.email,
          })),
        )
        setAssignEmployeeId(
          (current) => current || published.employees[0]?.id || '',
        )
        setAssignItemId(
          (current) =>
            current ||
            inventory.items.find((item) => item.status === 'available')?.id ||
            '',
        )
      } catch (err) {
        if (cancelled) return
        setError(
          err instanceof ApiError
            ? err.message
            : 'Could not load equipment admin data.',
        )
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void load()
    return () => {
      cancelled = true
    }
  }, [membership, search, statusFilter, categoryFilter, listEpoch])

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
          title="Equipment admin"
          description="Sign in as an admin to manage inventory."
        />
      </Box>
    )
  }

  if (membership.role !== 'admin') {
    return <Navigate to="/equipment" replace />
  }

  const handleSaveItem = async (event: FormEvent) => {
    event.preventDefault()
    setSaving(true)
    setError(null)
    try {
      if (editId) {
        await updateInventoryItem(editId, {
          assetTag,
          name,
          category,
          serialNumber: serialNumber || null,
        })
      } else {
        await createInventoryItem({
          assetTag,
          name,
          category,
          serialNumber: serialNumber || null,
          status: 'available',
        })
      }
      setEditId(null)
      setAssetTag('')
      setName('')
      setSerialNumber('')
      reload()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not save item.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Box component="main">
      <PageHeader
        eyebrow="Administration"
        title="Equipment inventory"
        description="Manage asset tags, approve requests, assign available items, and record returns. Approval never auto-assigns gear."
        actions={
          <Button component={RouterLink} to="/equipment" variant="outlined">
            My equipment
          </Button>
        }
      />

      <Tabs
        value={tab}
        onChange={(_, value: 'inventory' | 'requests' | 'assignments') =>
          setTab(value)
        }
        sx={{ mb: 2 }}
      >
        <Tab value="inventory" label="Inventory" />
        <Tab value="requests" label="Requests" />
        <Tab value="assignments" label="Assignments" />
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

      {tab === 'inventory' ? (
        <Stack spacing={2}>
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            spacing={2}
            useFlexGap
            sx={{ flexWrap: 'wrap' }}
          >
            <TextField
              label="Search"
              placeholder="Asset tag, name, serial"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              sx={{ minWidth: 200, flex: 1 }}
            />
            <FormControl sx={{ minWidth: 140 }}>
              <InputLabel id="inv-status-label">Status</InputLabel>
              <Select
                labelId="inv-status-label"
                label="Status"
                value={statusFilter}
                onChange={(event) =>
                  setStatusFilter(
                    event.target.value as EquipmentItemStatus | 'all',
                  )
                }
              >
                <MenuItem value="all">All</MenuItem>
                {itemStatuses.map((status) => (
                  <MenuItem key={status} value={status}>
                    {status}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl sx={{ minWidth: 140 }}>
              <InputLabel id="inv-cat-label">Category</InputLabel>
              <Select
                labelId="inv-cat-label"
                label="Category"
                value={categoryFilter}
                onChange={(event) =>
                  setCategoryFilter(
                    event.target.value as EquipmentCategory | 'all',
                  )
                }
              >
                <MenuItem value="all">All</MenuItem>
                {categories.map((value) => (
                  <MenuItem key={value} value={value}>
                    {value}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Stack>

          <Paper
            component="form"
            onSubmit={(event) => void handleSaveItem(event)}
            sx={{ p: 2 }}
          >
            <Typography variant="subtitle1" sx={{ mb: 1.5 }}>
              {editId ? 'Edit item' : 'Create item'}
            </Typography>
            <Stack spacing={2}>
              <TextField
                label="Asset tag"
                value={assetTag}
                onChange={(event) => setAssetTag(event.target.value)}
                required
                disabled={saving}
              />
              <TextField
                label="Name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                required
                disabled={saving}
              />
              <FormControl disabled={saving}>
                <InputLabel id="item-cat-label">Category</InputLabel>
                <Select
                  labelId="item-cat-label"
                  label="Category"
                  value={category}
                  onChange={(event) =>
                    setCategory(event.target.value as EquipmentCategory)
                  }
                >
                  {categories.map((value) => (
                    <MenuItem key={value} value={value}>
                      {value}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <TextField
                label="Serial number"
                value={serialNumber}
                onChange={(event) => setSerialNumber(event.target.value)}
                disabled={saving}
              />
              <Stack direction="row" spacing={1}>
                <Button type="submit" variant="contained" disabled={saving}>
                  {saving ? 'Saving…' : editId ? 'Save changes' : 'Create item'}
                </Button>
                {editId ? (
                  <Button
                    type="button"
                    variant="outlined"
                    disabled={saving}
                    onClick={() => {
                      setEditId(null)
                      setAssetTag('')
                      setName('')
                      setSerialNumber('')
                    }}
                  >
                    Cancel edit
                  </Button>
                ) : null}
              </Stack>
            </Stack>
          </Paper>

          <TableContainer component={Paper}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Asset</TableCell>
                  <TableCell>Category</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Serial</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {items.map((item) => (
                  <TableRow key={item.id} hover>
                    <TableCell>
                      {item.assetTag} · {item.name}
                    </TableCell>
                    <TableCell sx={{ textTransform: 'capitalize' }}>
                      {item.category}
                    </TableCell>
                    <TableCell>
                      <StatusChip status={item.status} />
                    </TableCell>
                    <TableCell>{item.serialNumber ?? '—'}</TableCell>
                    <TableCell align="right">
                      <Button
                        size="small"
                        variant="outlined"
                        onClick={() => {
                          setEditId(item.id)
                          setAssetTag(item.assetTag)
                          setName(item.name)
                          setCategory(item.category)
                          setSerialNumber(item.serialNumber ?? '')
                        }}
                      >
                        Edit
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Stack>
      ) : null}

      {tab === 'requests' ? (
        <Stack spacing={2}>
          <TextField
            label="Optional decision response"
            value={decisionResponse}
            onChange={(event) => setDecisionResponse(event.target.value)}
          />
          <Stack spacing={1}>
            {requests.map((request) => (
              <Paper key={request.id} sx={{ p: 2 }}>
                <Stack direction="row" spacing={1} sx={{ alignItems: 'center', flexWrap: 'wrap' }}>
                  <Typography variant="subtitle2" sx={{ textTransform: 'capitalize' }}>
                    {request.category}
                  </Typography>
                  <StatusChip status={request.status} />
                  <Typography variant="body2">
                    {request.requesterName ?? 'Employee'}
                  </Typography>
                </Stack>
                <Typography variant="body2" sx={{ mt: 0.5 }}>
                  {request.reason}
                </Typography>
                {request.adminResponse ? (
                  <Typography variant="body2" color="text.secondary">
                    Response: {request.adminResponse}
                  </Typography>
                ) : null}
                {request.status === 'pending' ? (
                  <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                    <Button
                      variant="contained"
                      size="small"
                      disabled={saving}
                      onClick={() => {
                        void (async () => {
                          setSaving(true)
                          setError(null)
                          try {
                            await approveEquipmentRequest(
                              request.id,
                              decisionResponse || undefined,
                            )
                            reload()
                          } catch (err) {
                            setError(
                              err instanceof ApiError
                                ? err.message
                                : 'Approve failed.',
                            )
                          } finally {
                            setSaving(false)
                          }
                        })()
                      }}
                    >
                      Approve
                    </Button>
                    <Button
                      variant="outlined"
                      size="small"
                      disabled={saving}
                      onClick={() => {
                        void (async () => {
                          setSaving(true)
                          setError(null)
                          try {
                            await declineEquipmentRequest(
                              request.id,
                              decisionResponse || undefined,
                            )
                            reload()
                          } catch (err) {
                            setError(
                              err instanceof ApiError
                                ? err.message
                                : 'Decline failed.',
                            )
                          } finally {
                            setSaving(false)
                          }
                        })()
                      }}
                    >
                      Decline
                    </Button>
                  </Stack>
                ) : null}
                {request.status === 'approved' ? (
                  <Stack
                    direction={{ xs: 'column', sm: 'row' }}
                    spacing={1}
                    sx={{ mt: 1, alignItems: { sm: 'center' } }}
                  >
                    <FormControl size="small" sx={{ minWidth: 220 }}>
                      <InputLabel id={`fulfil-${request.id}`}>Available item</InputLabel>
                      <Select
                        labelId={`fulfil-${request.id}`}
                        label="Available item"
                        value={
                          fulfilRequestId === request.id ? fulfilItemId : ''
                        }
                        onChange={(event) => {
                          setFulfilRequestId(request.id)
                          setFulfilItemId(event.target.value)
                        }}
                      >
                        <MenuItem value="">Select available item</MenuItem>
                        {availableItems.map((item) => (
                          <MenuItem key={item.id} value={item.id}>
                            {item.assetTag} · {item.name}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                    <Button
                      size="small"
                      variant="contained"
                      disabled={
                        saving ||
                        fulfilRequestId !== request.id ||
                        !fulfilItemId
                      }
                      onClick={() => {
                        void (async () => {
                          setSaving(true)
                          setError(null)
                          try {
                            await fulfilEquipmentRequest(request.id, {
                              itemId: fulfilItemId,
                              issuedAt: new Date().toISOString(),
                            })
                            setFulfilRequestId(null)
                            setFulfilItemId('')
                            reload()
                          } catch (err) {
                            setError(
                              err instanceof ApiError
                                ? err.message
                                : 'Fulfilment failed.',
                            )
                          } finally {
                            setSaving(false)
                          }
                        })()
                      }}
                    >
                      Fulfil with item
                    </Button>
                  </Stack>
                ) : null}
              </Paper>
            ))}
          </Stack>
        </Stack>
      ) : null}

      {tab === 'assignments' ? (
        <Stack spacing={2}>
          <Paper
            component="form"
            onSubmit={(event) => {
              event.preventDefault()
              void (async () => {
                setSaving(true)
                setError(null)
                try {
                  await assignEquipment({
                    itemId: assignItemId,
                    employeeId: assignEmployeeId,
                    issuedAt: issuedAt || new Date().toISOString(),
                    expectedReturnAt: expectedReturnAt || null,
                  })
                  reload()
                } catch (err) {
                  setError(
                    err instanceof ApiError
                      ? err.message
                      : 'Assignment failed.',
                  )
                } finally {
                  setSaving(false)
                }
              })()
            }}
            sx={{ p: 2 }}
          >
            <Typography variant="subtitle1" sx={{ mb: 1.5 }}>
              Assign available item
            </Typography>
            <Stack spacing={2}>
              <FormControl required disabled={saving}>
                <InputLabel id="assign-item-label">Item</InputLabel>
                <Select
                  labelId="assign-item-label"
                  label="Item"
                  value={assignItemId}
                  onChange={(event) => setAssignItemId(event.target.value)}
                >
                  {availableItems.map((item) => (
                    <MenuItem key={item.id} value={item.id}>
                      {item.assetTag} · {item.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <FormControl required disabled={saving}>
                <InputLabel id="assign-emp-label">Employee</InputLabel>
                <Select
                  labelId="assign-emp-label"
                  label="Employee"
                  value={assignEmployeeId}
                  onChange={(event) => setAssignEmployeeId(event.target.value)}
                >
                  {employees.map((employee) => (
                    <MenuItem key={employee.id} value={employee.id}>
                      {employee.name} ({employee.email})
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <TextField
                label="Issue date"
                type="date"
                value={issuedAt}
                onChange={(event) => setIssuedAt(event.target.value)}
                disabled={saving}
                slotProps={{ inputLabel: { shrink: true } }}
              />
              <TextField
                label="Expected return"
                type="date"
                value={expectedReturnAt}
                onChange={(event) => setExpectedReturnAt(event.target.value)}
                disabled={saving}
                slotProps={{ inputLabel: { shrink: true } }}
              />
              <Button type="submit" variant="contained" disabled={saving}>
                Assign
              </Button>
            </Stack>
          </Paper>

          <Stack spacing={1}>
            {assignments.map((assignment) => (
              <Paper key={assignment.id} sx={{ p: 2 }}>
                <Typography variant="subtitle2">
                  {assignment.item?.assetTag ?? 'Item'} →{' '}
                  {assignment.employeeName ?? 'Employee'}
                  {assignment.active ? ' (active)' : ' (returned)'}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Issued {assignment.issuedAt.slice(0, 10)}
                  {assignment.returnedAt
                    ? ` · Returned ${assignment.returnedAt.slice(0, 10)}`
                    : ''}
                </Typography>
                {assignment.active ? (
                  returnAssignmentId === assignment.id ? (
                    <Box
                      component="form"
                      onSubmit={(event) => {
                        event.preventDefault()
                        void (async () => {
                          setSaving(true)
                          setError(null)
                          try {
                            await returnEquipment(assignment.id, {
                              returnedAt:
                                returnedAt || new Date().toISOString(),
                              returnCondition,
                              nextItemStatus,
                              returnNotes: returnNotes || null,
                            })
                            setReturnAssignmentId(null)
                            reload()
                          } catch (err) {
                            setError(
                              err instanceof ApiError
                                ? err.message
                                : 'Return failed.',
                            )
                          } finally {
                            setSaving(false)
                          }
                        })()
                      }}
                      sx={{ mt: 1.5 }}
                    >
                      <Stack spacing={1.5}>
                        <TextField
                          label="Return date"
                          type="date"
                          value={returnedAt}
                          onChange={(event) =>
                            setReturnedAt(event.target.value)
                          }
                          required
                          disabled={saving}
                          slotProps={{ inputLabel: { shrink: true } }}
                        />
                        <FormControl disabled={saving}>
                          <InputLabel id={`cond-${assignment.id}`}>Condition</InputLabel>
                          <Select
                            labelId={`cond-${assignment.id}`}
                            label="Condition"
                            value={returnCondition}
                            onChange={(event) =>
                              setReturnCondition(
                                event.target.value as EquipmentReturnCondition,
                              )
                            }
                          >
                            <MenuItem value="good">Good</MenuItem>
                            <MenuItem value="damaged">Damaged</MenuItem>
                            <MenuItem value="needs_maintenance">
                              Needs maintenance
                            </MenuItem>
                          </Select>
                        </FormControl>
                        <FormControl disabled={saving}>
                          <InputLabel id={`next-${assignment.id}`}>Item becomes</InputLabel>
                          <Select
                            labelId={`next-${assignment.id}`}
                            label="Item becomes"
                            value={nextItemStatus}
                            onChange={(event) =>
                              setNextItemStatus(
                                event.target.value as 'available' | 'maintenance',
                              )
                            }
                          >
                            <MenuItem value="available">Available</MenuItem>
                            <MenuItem value="maintenance">Maintenance</MenuItem>
                          </Select>
                        </FormControl>
                        <TextField
                          label="Notes"
                          value={returnNotes}
                          onChange={(event) =>
                            setReturnNotes(event.target.value)
                          }
                          disabled={saving}
                        />
                        <Stack direction="row" spacing={1}>
                          <Button type="submit" variant="contained" disabled={saving}>
                            {saving ? 'Saving…' : 'Record return'}
                          </Button>
                          <Button
                            type="button"
                            variant="outlined"
                            onClick={() => setReturnAssignmentId(null)}
                          >
                            Cancel
                          </Button>
                        </Stack>
                      </Stack>
                    </Box>
                  ) : (
                    <Button
                      size="small"
                      variant="outlined"
                      sx={{ mt: 1 }}
                      onClick={() => {
                        setReturnAssignmentId(assignment.id)
                        setReturnedAt(new Date().toISOString().slice(0, 10))
                        setReturnCondition('good')
                        setNextItemStatus('available')
                        setReturnNotes('')
                      }}
                    >
                      Record return
                    </Button>
                  )
                ) : null}
              </Paper>
            ))}
          </Stack>
        </Stack>
      ) : null}
    </Box>
  )
}

export default AdminEquipmentPage
