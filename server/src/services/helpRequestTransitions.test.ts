import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  canAccessHelpRequest,
  planHelpRequestTransition,
} from './helpRequestTransitions.js'

describe('planHelpRequestTransition', () => {
  it('lets recipient accept or decline only from open', () => {
    assert.deepEqual(
      planHelpRequestTransition({
        action: 'accept',
        currentStatus: 'open',
        actor: 'recipient',
      }),
      {
        ok: true,
        nextStatus: 'accepted',
        timestampField: 'decidedAt',
      },
    )

    assert.deepEqual(
      planHelpRequestTransition({
        action: 'decline',
        currentStatus: 'open',
        actor: 'recipient',
      }),
      {
        ok: true,
        nextStatus: 'declined',
        timestampField: 'decidedAt',
      },
    )

    assert.equal(
      planHelpRequestTransition({
        action: 'accept',
        currentStatus: 'accepted',
        actor: 'recipient',
      }).ok,
      false,
    )

    assert.equal(
      planHelpRequestTransition({
        action: 'accept',
        currentStatus: 'open',
        actor: 'sender',
      }).ok,
      false,
    )
  })

  it('lets sender cancel only from open', () => {
    assert.deepEqual(
      planHelpRequestTransition({
        action: 'cancel',
        currentStatus: 'open',
        actor: 'sender',
      }),
      {
        ok: true,
        nextStatus: 'cancelled',
        timestampField: 'cancelledAt',
      },
    )

    assert.equal(
      planHelpRequestTransition({
        action: 'cancel',
        currentStatus: 'open',
        actor: 'recipient',
      }).ok,
      false,
    )

    assert.equal(
      planHelpRequestTransition({
        action: 'cancel',
        currentStatus: 'accepted',
        actor: 'sender',
      }).ok,
      false,
    )
  })

  it('lets sender resolve only from accepted', () => {
    assert.deepEqual(
      planHelpRequestTransition({
        action: 'resolve',
        currentStatus: 'accepted',
        actor: 'sender',
      }),
      {
        ok: true,
        nextStatus: 'resolved',
        timestampField: 'resolvedAt',
      },
    )

    assert.equal(
      planHelpRequestTransition({
        action: 'resolve',
        currentStatus: 'open',
        actor: 'sender',
      }).ok,
      false,
    )

    assert.equal(
      planHelpRequestTransition({
        action: 'resolve',
        currentStatus: 'accepted',
        actor: 'recipient',
      }).ok,
      false,
    )
  })
})

describe('canAccessHelpRequest', () => {
  it('allows sender membership id', () => {
    assert.equal(
      canAccessHelpRequest({
        membershipId: 'mem-1',
        membershipEmail: 'a@example.com',
        senderMembershipId: 'mem-1',
        recipientEmployeeEmail: 'b@example.com',
      }),
      true,
    )
  })

  it('allows recipient by matching email (case-insensitive)', () => {
    assert.equal(
      canAccessHelpRequest({
        membershipId: 'mem-2',
        membershipEmail: 'B@Example.com',
        senderMembershipId: 'mem-1',
        recipientEmployeeEmail: 'b@example.com',
      }),
      true,
    )
  })

  it('denies unrelated memberships', () => {
    assert.equal(
      canAccessHelpRequest({
        membershipId: 'mem-3',
        membershipEmail: 'c@example.com',
        senderMembershipId: 'mem-1',
        recipientEmployeeEmail: 'b@example.com',
      }),
      false,
    )
  })
})
