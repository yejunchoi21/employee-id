import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link as RouterLink } from 'react-router-dom'
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  List,
  ListItemButton,
  Paper,
  Stack,
  Tab,
  Tabs,
  TextField,
  Typography,
} from '@mui/material'
import { ApiError } from '../api/client'
import {
  acceptHelpRequest,
  cancelHelpRequest,
  declineHelpRequest,
  fetchHelpRequest,
  fetchHelpRequests,
  resolveHelpRequest,
  type HelpRequestDto,
  type HelpRequestStatus,
} from '../api/helpRequests'
import PageHeader from '../components/PageHeader'
import StatusChip from '../components/StatusChip'
import { useAuth } from '../hooks/useAuth'

type RequestBox = 'received' | 'sent'
type StatusFilter = HelpRequestStatus | 'all'

const statusFilters: Array<{ value: StatusFilter; label: string }> = [
  { value: 'all', label: 'All' },
  { value: 'open', label: 'Open' },
  { value: 'accepted', label: 'Accepted' },
  { value: 'declined', label: 'Declined' },
  { value: 'resolved', label: 'Resolved' },
  { value: 'cancelled', label: 'Cancelled' },
]

function statusLabel(status: HelpRequestStatus) {
  return status.charAt(0).toUpperCase() + status.slice(1)
}

function formatWhen(value: string | null) {
  if (!value) return 'Unknown time'
  try {
    return new Intl.DateTimeFormat(undefined, {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(new Date(value))
  } catch {
    return value
  }
}

function RequestsPage() {
  const { membership, isAuthLoading, refreshOpenIncomingCount } = useAuth()
  const [box, setBox] = useState<RequestBox>('received')
  const [status, setStatus] = useState<StatusFilter>('all')
  const [requests, setRequests] = useState<HelpRequestDto[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [selected, setSelected] = useState<HelpRequestDto | null>(null)
  const [loadingList, setLoadingList] = useState(false)
  const [loadingDetail, setLoadingDetail] = useState(false)
  const [listError, setListError] = useState<string | null>(null)
  const [detailError, setDetailError] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const [responseText, setResponseText] = useState('')
  const [savingAction, setSavingAction] = useState<string | null>(null)
  const [listEpoch, setListEpoch] = useState(0)

  const reloadList = useCallback(() => {
    setListEpoch((value) => value + 1)
  }, [])

  useEffect(() => {
    if (!membership) return

    let cancelled = false

    async function loadList() {
      setLoadingList(true)
      setListError(null)
      try {
        const result = await fetchHelpRequests({ box, status })
        if (cancelled) return
        setRequests(result.requests)
        setSelectedId((current) => {
          if (!current) return null
          return result.requests.some((request) => request.id === current)
            ? current
            : null
        })
      } catch (error) {
        if (cancelled) return
        setListError(
          error instanceof ApiError
            ? error.message
            : 'Could not load help requests.',
        )
        setRequests([])
        setSelectedId(null)
      } finally {
        if (!cancelled) setLoadingList(false)
      }
    }

    void loadList()
    return () => {
      cancelled = true
    }
  }, [box, membership, status, listEpoch])

  useEffect(() => {
    if (!selectedId || !membership) {
      return
    }

    let cancelled = false

    async function loadDetail() {
      setLoadingDetail(true)
      setDetailError(null)
      try {
        const result = await fetchHelpRequest(selectedId!)
        if (cancelled) return
        setSelected(result.request)
        setResponseText(result.request.response ?? '')
      } catch (error) {
        if (cancelled) return
        setSelected(null)
        setDetailError(
          error instanceof ApiError
            ? error.message
            : 'Could not load request details.',
        )
      } finally {
        if (!cancelled) setLoadingDetail(false)
      }
    }

    void loadDetail()
    return () => {
      cancelled = true
    }
  }, [membership, selectedId])

  const selectedForView = selectedId ? selected : null

  const isSender = useMemo(() => {
    if (!membership || !selectedForView) return false
    return selectedForView.senderMembershipId === membership.membershipId
  }, [membership, selectedForView])

  const isRecipient = useMemo(() => {
    if (!membership || !selectedForView) return false
    return (
      selectedForView.recipientEmail?.trim().toLowerCase() ===
      membership.email.trim().toLowerCase()
    )
  }, [membership, selectedForView])

  const runAction = async (
    actionKey: string,
    action: () => Promise<{ request: HelpRequestDto }>,
  ) => {
    setSavingAction(actionKey)
    setActionError(null)
    try {
      const result = await action()
      setSelected(result.request)
      await refreshOpenIncomingCount()
      reloadList()
    } catch (error) {
      setActionError(
        error instanceof ApiError
          ? error.message
          : 'Could not update this request.',
      )
    } finally {
      setSavingAction(null)
    }
  }

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
          title="Requests"
          description="Sign in from the header to view and manage help requests."
        />
      </Box>
    )
  }

  const switchBox = (next: RequestBox) => {
    setBox(next)
    setSelectedId(null)
    setSelected(null)
  }

  return (
    <Box component="main">
      <PageHeader
        eyebrow="Peer support"
        title="Requests"
        description="Send questions to teammates and respond to requests you receive."
        actions={
          <Button component={RouterLink} to="/directory" variant="outlined">
            Back to directory
          </Button>
        }
      />

      <Tabs
        value={box}
        onChange={(_, value: RequestBox) => switchBox(value)}
        aria-label="Mailbox"
        sx={{ mb: 1.5 }}
      >
        <Tab value="received" label="Received" />
        <Tab value="sent" label="Sent" />
      </Tabs>

      <Stack
        direction="row"
        useFlexGap
        spacing={1}
        aria-label="Status filters"
        role="group"
        sx={{ mb: 2, flexWrap: 'wrap' }}
      >
        {statusFilters.map((filter) => (
          <Chip
            key={filter.value}
            label={filter.label}
            clickable
            color={status === filter.value ? 'primary' : 'default'}
            variant={status === filter.value ? 'filled' : 'outlined'}
            aria-pressed={status === filter.value}
            onClick={() => setStatus(filter.value)}
          />
        ))}
      </Stack>

      <Stack
        direction={{ xs: 'column', md: 'row' }}
        spacing={2}
        sx={{ alignItems: 'flex-start' }}
      >
        <Box
          component="section"
          aria-label="Request list"
          sx={{ width: { xs: '100%', md: 340 }, flexShrink: 0 }}
        >
          {loadingList ? (
            <Stack direction="row" spacing={1} sx={{ mb: 1, alignItems: 'center' }}>
              <CircularProgress size={18} />
              <Typography variant="body2">Loading requests…</Typography>
            </Stack>
          ) : null}
          {listError ? (
            <Alert severity="error" sx={{ mb: 1 }}>
              {listError}
            </Alert>
          ) : null}
          {!loadingList && !listError && requests.length === 0 ? (
            <Paper sx={{ p: 3, textAlign: 'center' }}>
              <Typography variant="subtitle1">Nothing here</Typography>
              <Typography variant="body2">No requests in this view.</Typography>
            </Paper>
          ) : null}
          {requests.length > 0 ? (
            <Paper>
              <List disablePadding>
                {requests.map((request) => (
                  <ListItemButton
                    key={request.id}
                    selected={selectedId === request.id}
                    onClick={() => setSelectedId(request.id)}
                    sx={{ display: 'block' }}
                  >
                    <StatusChip
                      status={request.status}
                      label={statusLabel(request.status)}
                    />
                    <Typography variant="subtitle1" sx={{ mt: 0.5 }}>
                      {request.subject}
                    </Typography>
                    <Typography variant="body2" component="div">
                      {box === 'received'
                        ? `From ${request.senderName ?? 'teammate'}`
                        : `To ${request.recipientName ?? 'teammate'}`}
                    </Typography>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      component="time"
                      dateTime={request.createdAt ?? undefined}
                      sx={{ display: 'block' }}
                    >
                      {formatWhen(request.createdAt)}
                    </Typography>
                  </ListItemButton>
                ))}
              </List>
            </Paper>
          ) : null}
        </Box>

        <Box
          component="section"
          aria-live="polite"
          sx={{ flex: 1, minWidth: 0, width: '100%' }}
        >
          {!selectedId ? (
            <Paper sx={{ p: 3, textAlign: 'center' }}>
              <Typography variant="body2">
                Select a request to see details and available actions.
              </Typography>
            </Paper>
          ) : null}
          {loadingDetail ? (
            <Stack direction="row" spacing={1} sx={{ mb: 1, alignItems: 'center' }}>
              <CircularProgress size={18} />
              <Typography variant="body2">Loading details…</Typography>
            </Stack>
          ) : null}
          {detailError ? (
            <Alert severity="error" sx={{ mb: 1 }}>
              {detailError}
            </Alert>
          ) : null}
          {selectedForView && !loadingDetail ? (
            <Paper component="article" sx={{ p: 2 }}>
              <Stack spacing={2}>
                <Box>
                  <StatusChip
                    status={selectedForView.status}
                    label={statusLabel(selectedForView.status)}
                  />
                  <Typography variant="h2" sx={{ mt: 1 }}>
                    {selectedForView.subject}
                  </Typography>
                  <Typography variant="body2">
                    {selectedForView.priority.charAt(0).toUpperCase() +
                      selectedForView.priority.slice(1)}{' '}
                    priority · {formatWhen(selectedForView.createdAt)}
                  </Typography>
                </Box>

                <Stack spacing={1} component="dl" sx={{ m: 0 }}>
                  <Box>
                    <Typography variant="overline" color="text.secondary" component="dt">
                      From
                    </Typography>
                    <Typography variant="body1" component="dd" sx={{ m: 0 }}>
                      {selectedForView.senderName ?? 'Unknown'} (
                      {selectedForView.senderEmail ?? 'n/a'})
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="overline" color="text.secondary" component="dt">
                      To
                    </Typography>
                    <Typography variant="body1" component="dd" sx={{ m: 0 }}>
                      {selectedForView.recipientName ?? 'Unknown'} (
                      {selectedForView.recipientEmail ?? 'n/a'})
                    </Typography>
                  </Box>
                </Stack>

                <Box component="section">
                  <Typography variant="h3" component="h3">
                    Question
                  </Typography>
                  <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
                    {selectedForView.question}
                  </Typography>
                </Box>

                {selectedForView.response ? (
                  <Box component="section">
                    <Typography variant="h3" component="h3">
                      Response
                    </Typography>
                    <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
                      {selectedForView.response}
                    </Typography>
                  </Box>
                ) : null}

                {isRecipient && selectedForView.status === 'open' ? (
                  <TextField
                    label="Optional response"
                    value={responseText}
                    onChange={(event) => setResponseText(event.target.value)}
                    multiline
                    minRows={3}
                    disabled={Boolean(savingAction)}
                    slotProps={{ htmlInput: { maxLength: 4000 } }}
                  />
                ) : null}

                {actionError ? <Alert severity="error">{actionError}</Alert> : null}

                <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: 'wrap' }}>
                  {isRecipient && selectedForView.status === 'open' ? (
                    <>
                      <Button
                        type="button"
                        variant="contained"
                        disabled={Boolean(savingAction)}
                        onClick={() =>
                          void runAction('accept', () =>
                            acceptHelpRequest(
                              selectedForView.id,
                              responseText.trim() || undefined,
                            ),
                          )
                        }
                      >
                        {savingAction === 'accept' ? 'Accepting…' : 'Accept'}
                      </Button>
                      <Button
                        type="button"
                        variant="outlined"
                        disabled={Boolean(savingAction)}
                        onClick={() =>
                          void runAction('decline', () =>
                            declineHelpRequest(
                              selectedForView.id,
                              responseText.trim() || undefined,
                            ),
                          )
                        }
                      >
                        {savingAction === 'decline' ? 'Declining…' : 'Decline'}
                      </Button>
                    </>
                  ) : null}

                  {isSender && selectedForView.status === 'open' ? (
                    <Button
                      type="button"
                      variant="outlined"
                      disabled={Boolean(savingAction)}
                      onClick={() =>
                        void runAction('cancel', () =>
                          cancelHelpRequest(selectedForView.id),
                        )
                      }
                    >
                      {savingAction === 'cancel' ? 'Cancelling…' : 'Cancel request'}
                    </Button>
                  ) : null}

                  {isSender && selectedForView.status === 'accepted' ? (
                    <Button
                      type="button"
                      variant="contained"
                      disabled={Boolean(savingAction)}
                      onClick={() =>
                        void runAction('resolve', () =>
                          resolveHelpRequest(selectedForView.id),
                        )
                      }
                    >
                      {savingAction === 'resolve'
                        ? 'Resolving…'
                        : 'Mark resolved'}
                    </Button>
                  ) : null}
                </Stack>
              </Stack>
            </Paper>
          ) : null}
        </Box>
      </Stack>
    </Box>
  )
}

export default RequestsPage
