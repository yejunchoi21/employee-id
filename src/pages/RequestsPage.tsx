import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
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
import { useAuth } from '../hooks/useAuth'
import './RequestsPage.css'

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
      <main className="requests-page">
        <p className="requests-page__status">Checking your session…</p>
      </main>
    )
  }

  if (!membership) {
    return (
      <main className="requests-page">
        <header className="requests-page__hero">
          <h1>Requests</h1>
          <p>Sign in from the header to view and manage help requests.</p>
        </header>
      </main>
    )
  }

  return (
    <main className="requests-page">
      <header className="requests-page__hero">
        <div>
          <p className="requests-page__eyebrow">Peer support</p>
          <h1>Requests</h1>
          <p>
            Send questions to teammates and respond to requests you receive.
          </p>
        </div>
        <Link to="/directory" className="requests-page__directory-link">
          Back to directory
        </Link>
      </header>

      <div className="requests-page__tabs" role="tablist" aria-label="Mailbox">
        <button
          type="button"
          role="tab"
          aria-selected={box === 'received'}
          className={box === 'received' ? 'is-active' : undefined}
          onClick={() => {
            setBox('received')
            setSelectedId(null)
            setSelected(null)
          }}
        >
          Received
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={box === 'sent'}
          className={box === 'sent' ? 'is-active' : undefined}
          onClick={() => {
            setBox('sent')
            setSelectedId(null)
            setSelected(null)
          }}
        >
          Sent
        </button>
      </div>

      <div className="requests-page__filters" aria-label="Status filters">
        {statusFilters.map((filter) => (
          <button
            key={filter.value}
            type="button"
            className={status === filter.value ? 'is-active' : undefined}
            onClick={() => setStatus(filter.value)}
          >
            {filter.label}
          </button>
        ))}
      </div>

      <div className="requests-page__layout">
        <section className="requests-page__list" aria-label="Request list">
          {loadingList ? (
            <p className="requests-page__status">Loading requests…</p>
          ) : null}
          {listError ? (
            <p className="requests-page__error" role="alert">
              {listError}
            </p>
          ) : null}
          {!loadingList && !listError && requests.length === 0 ? (
            <p className="requests-page__status">No requests in this view.</p>
          ) : null}
          <ul>
            {requests.map((request) => (
              <li key={request.id}>
                <button
                  type="button"
                  className={
                    selectedId === request.id
                      ? 'requests-page__item is-selected'
                      : 'requests-page__item'
                  }
                  onClick={() => setSelectedId(request.id)}
                >
                  <span
                    className={`requests-page__badge requests-page__badge--${request.status}`}
                  >
                    {statusLabel(request.status)}
                  </span>
                  <strong>{request.subject}</strong>
                  <span>
                    {box === 'received'
                      ? `From ${request.senderName ?? 'teammate'}`
                      : `To ${request.recipientName ?? 'teammate'}`}
                  </span>
                  <time dateTime={request.createdAt ?? undefined}>
                    {formatWhen(request.createdAt)}
                  </time>
                </button>
              </li>
            ))}
          </ul>
        </section>

        <section className="requests-page__detail" aria-live="polite">
          {!selectedId ? (
            <p className="requests-page__status">
              Select a request to see details and available actions.
            </p>
          ) : null}
          {loadingDetail ? (
            <p className="requests-page__status">Loading details…</p>
          ) : null}
          {detailError ? (
            <p className="requests-page__error" role="alert">
              {detailError}
            </p>
          ) : null}
          {selectedForView && !loadingDetail ? (
            <article className="requests-page__card">
              <header>
                <span
                  className={`requests-page__badge requests-page__badge--${selectedForView.status}`}
                >
                  {statusLabel(selectedForView.status)}
                </span>
                <h2>{selectedForView.subject}</h2>
                <p>
                  {selectedForView.priority.charAt(0).toUpperCase() +
                    selectedForView.priority.slice(1)}{' '}
                  priority · {formatWhen(selectedForView.createdAt)}
                </p>
              </header>

              <dl>
                <div>
                  <dt>From</dt>
                  <dd>
                    {selectedForView.senderName ?? 'Unknown'} (
                    {selectedForView.senderEmail ?? 'n/a'})
                  </dd>
                </div>
                <div>
                  <dt>To</dt>
                  <dd>
                    {selectedForView.recipientName ?? 'Unknown'} (
                    {selectedForView.recipientEmail ?? 'n/a'})
                  </dd>
                </div>
              </dl>

              <section>
                <h3>Question</h3>
                <p>{selectedForView.question}</p>
              </section>

              {selectedForView.response ? (
                <section>
                  <h3>Response</h3>
                  <p>{selectedForView.response}</p>
                </section>
              ) : null}

              {isRecipient && selectedForView.status === 'open' ? (
                <label className="requests-page__response">
                  <span>Optional response</span>
                  <textarea
                    value={responseText}
                    onChange={(event) => setResponseText(event.target.value)}
                    rows={3}
                    maxLength={4000}
                    disabled={Boolean(savingAction)}
                  />
                </label>
              ) : null}

              {actionError ? (
                <p className="requests-page__error" role="alert">
                  {actionError}
                </p>
              ) : null}

              <div className="requests-page__actions">
                {isRecipient && selectedForView.status === 'open' ? (
                  <>
                    <button
                      type="button"
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
                    </button>
                    <button
                      type="button"
                      className="is-secondary"
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
                    </button>
                  </>
                ) : null}

                {isSender && selectedForView.status === 'open' ? (
                  <button
                    type="button"
                    className="is-secondary"
                    disabled={Boolean(savingAction)}
                    onClick={() =>
                      void runAction('cancel', () =>
                        cancelHelpRequest(selectedForView.id),
                      )
                    }
                  >
                    {savingAction === 'cancel' ? 'Cancelling…' : 'Cancel request'}
                  </button>
                ) : null}

                {isSender && selectedForView.status === 'accepted' ? (
                  <button
                    type="button"
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
                  </button>
                ) : null}
              </div>
            </article>
          ) : null}
        </section>
      </div>
    </main>
  )
}

export default RequestsPage
