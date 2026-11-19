import type { HelpRequestStatus } from '../models/HelpRequest.js'

export type HelpRequestAction =
  | 'accept'
  | 'decline'
  | 'resolve'
  | 'cancel'

export interface TransitionResult {
  ok: true
  nextStatus: HelpRequestStatus
  timestampField: 'decidedAt' | 'resolvedAt' | 'cancelledAt'
}

export interface TransitionFailure {
  ok: false
  error: string
}

/**
 * Pure status-machine rules for help requests.
 * Routes still enforce role (sender vs recipient) separately.
 */
export function planHelpRequestTransition(input: {
  action: HelpRequestAction
  currentStatus: HelpRequestStatus
  actor: 'sender' | 'recipient'
}): TransitionResult | TransitionFailure {
  const { action, currentStatus, actor } = input

  if (action === 'accept' || action === 'decline') {
    if (actor !== 'recipient') {
      return { ok: false, error: 'Only the recipient can decide an open request.' }
    }
    if (currentStatus !== 'open') {
      return {
        ok: false,
        error: `Only open requests can be ${action}ed.`,
      }
    }
    return {
      ok: true,
      nextStatus: action === 'accept' ? 'accepted' : 'declined',
      timestampField: 'decidedAt',
    }
  }

  if (action === 'cancel') {
    if (actor !== 'sender') {
      return { ok: false, error: 'Only the sender can cancel an open request.' }
    }
    if (currentStatus !== 'open') {
      return { ok: false, error: 'Only open requests can be cancelled.' }
    }
    return {
      ok: true,
      nextStatus: 'cancelled',
      timestampField: 'cancelledAt',
    }
  }

  if (action === 'resolve') {
    if (actor !== 'sender') {
      return {
        ok: false,
        error: 'Only the sender can mark an accepted request resolved.',
      }
    }
    if (currentStatus !== 'accepted') {
      return {
        ok: false,
        error: 'Only accepted requests can be marked resolved.',
      }
    }
    return {
      ok: true,
      nextStatus: 'resolved',
      timestampField: 'resolvedAt',
    }
  }

  return { ok: false, error: 'Unsupported action.' }
}

export function canAccessHelpRequest(input: {
  membershipId: string
  membershipEmail: string
  senderMembershipId: string
  recipientEmployeeEmail: string
}) {
  if (input.membershipId === input.senderMembershipId) return true
  return (
    input.membershipEmail.trim().toLowerCase() ===
    input.recipientEmployeeEmail.trim().toLowerCase()
  )
}
