import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { Types } from 'mongoose'
import { presentMembership } from './membershipPresenters.js'

describe('presentMembership', () => {
  it('never includes passwordHash', () => {
    const presented = presentMembership({
      _id: new Types.ObjectId(),
      companyId: new Types.ObjectId(),
      email: 'member@example.com',
      displayName: 'Member',
      role: 'member',
      employeeId: new Types.ObjectId(),
      mustChangePassword: true,
    })

    assert.equal(
      Object.prototype.hasOwnProperty.call(presented, 'passwordHash'),
      false,
    )
    assert.equal(presented.role, 'member')
    assert.equal(presented.mustChangePassword, true)
    assert.equal(typeof presented.employeeId, 'string')
  })
})
