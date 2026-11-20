import type { EquipmentItemStatus } from '../models/EquipmentItem.js'
import type { EquipmentRequestStatus } from '../models/EquipmentRequest.js'

export function canViewEmployeeEquipment(input: {
  isAdmin: boolean
  actorEmployeeId: string | null
  targetEmployeeId: string
}) {
  if (input.isAdmin) return true
  return (
    Boolean(input.actorEmployeeId) &&
    input.actorEmployeeId === input.targetEmployeeId
  )
}

export function canCancelEquipmentRequest(input: {
  isAdmin: boolean
  actorEmployeeId: string | null
  requesterEmployeeId: string
  status: EquipmentRequestStatus
}) {
  if (input.status !== 'pending') return false
  if (input.isAdmin) return true
  return (
    Boolean(input.actorEmployeeId) &&
    input.actorEmployeeId === input.requesterEmployeeId
  )
}

export function planRequestDecision(input: {
  action: 'approve' | 'decline' | 'cancel'
  status: EquipmentRequestStatus
  actor: 'admin' | 'requester' | 'other'
}) {
  if (input.action === 'cancel') {
    if (input.actor === 'other') {
      return { ok: false as const, error: 'Only the requester can cancel.' }
    }
    if (input.status !== 'pending') {
      return {
        ok: false as const,
        error: 'Only pending requests can be cancelled.',
      }
    }
    return { ok: true as const, nextStatus: 'cancelled' as const }
  }

  if (input.actor !== 'admin') {
    return { ok: false as const, error: 'Only admins can decide requests.' }
  }
  if (input.status !== 'pending') {
    return {
      ok: false as const,
      error: `Only pending requests can be ${input.action}d.`,
    }
  }
  return {
    ok: true as const,
    nextStatus:
      input.action === 'approve'
        ? ('approved' as const)
        : ('declined' as const),
  }
}

export function planItemReturnStatus(choice: 'available' | 'maintenance') {
  return choice
}

export function canAssignItem(status: EquipmentItemStatus) {
  return status === 'available'
}

export function assertNoActiveAssignmentConflict(exists: boolean) {
  if (exists) {
    return 'This item already has an active assignment.'
  }
  return null
}
