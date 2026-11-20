import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  assertNoActiveAssignmentConflict,
  canAssignItem,
  canCancelEquipmentRequest,
  canViewEmployeeEquipment,
  planItemReturnStatus,
  planRequestDecision,
} from './equipmentAccess.js'

describe('equipment access', () => {
  it('isolates equipment visibility to owner and admin', () => {
    assert.equal(
      canViewEmployeeEquipment({
        isAdmin: false,
        actorEmployeeId: 'emp-1',
        targetEmployeeId: 'emp-1',
      }),
      true,
    )
    assert.equal(
      canViewEmployeeEquipment({
        isAdmin: false,
        actorEmployeeId: 'emp-2',
        targetEmployeeId: 'emp-1',
      }),
      false,
    )
    assert.equal(
      canViewEmployeeEquipment({
        isAdmin: true,
        actorEmployeeId: 'emp-2',
        targetEmployeeId: 'emp-1',
      }),
      true,
    )
  })

  it('lets requester cancel only pending requests', () => {
    assert.equal(
      canCancelEquipmentRequest({
        isAdmin: false,
        actorEmployeeId: 'emp-1',
        requesterEmployeeId: 'emp-1',
        status: 'pending',
      }),
      true,
    )
    assert.equal(
      canCancelEquipmentRequest({
        isAdmin: false,
        actorEmployeeId: 'emp-1',
        requesterEmployeeId: 'emp-1',
        status: 'approved',
      }),
      false,
    )
  })
})

describe('equipment request transitions', () => {
  it('approves and declines only from pending by admin', () => {
    assert.deepEqual(
      planRequestDecision({
        action: 'approve',
        status: 'pending',
        actor: 'admin',
      }),
      { ok: true, nextStatus: 'approved' },
    )
    assert.equal(
      planRequestDecision({
        action: 'approve',
        status: 'pending',
        actor: 'requester',
      }).ok,
      false,
    )
    assert.equal(
      planRequestDecision({
        action: 'decline',
        status: 'approved',
        actor: 'admin',
      }).ok,
      false,
    )
  })

  it('cancels pending requests for requester', () => {
    assert.deepEqual(
      planRequestDecision({
        action: 'cancel',
        status: 'pending',
        actor: 'requester',
      }),
      { ok: true, nextStatus: 'cancelled' },
    )
  })
})

describe('assignment guards', () => {
  it('only available items can be assigned and blocks duplicates', () => {
    assert.equal(canAssignItem('available'), true)
    assert.equal(canAssignItem('assigned'), false)
    assert.equal(canAssignItem('maintenance'), false)
    assert.equal(canAssignItem('retired'), false)
    assert.equal(
      assertNoActiveAssignmentConflict(true),
      'This item already has an active assignment.',
    )
    assert.equal(assertNoActiveAssignmentConflict(false), null)
  })

  it('maps return choice to available or maintenance only', () => {
    assert.equal(planItemReturnStatus('available'), 'available')
    assert.equal(planItemReturnStatus('maintenance'), 'maintenance')
  })
})
