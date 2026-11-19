import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  changePasswordSchema,
  createEmployeeAccountSchema,
} from './employeeAccount.js'

describe('createEmployeeAccountSchema', () => {
  it('requires a strong enough initial password and normalizes email', () => {
    const parsed = createEmployeeAccountSchema.safeParse({
      email: 'Alex@Northline.co',
      displayName: 'Alex Rivera',
      initialPassword: 'TempPass12',
      departmentId: 'dept-1',
      title: 'Engineer',
      office: 'Seattle',
      joined: 'Jan 2025',
      phone: '+1 555',
      manager: 'Pat',
      bio: 'Builds things.',
      skills: 'TypeScript, React',
    })

    assert.equal(parsed.success, true)
    if (parsed.success) {
      assert.equal(parsed.data.email, 'alex@northline.co')
      assert.deepEqual(parsed.data.skills, ['TypeScript', 'React'])
    }

    const weak = createEmployeeAccountSchema.safeParse({
      email: 'alex@northline.co',
      displayName: 'Alex',
      initialPassword: 'short',
      departmentId: 'dept-1',
      title: 'Engineer',
      office: 'Seattle',
      joined: 'Jan 2025',
      phone: '+1 555',
      manager: 'Pat',
      bio: 'Builds things.',
      skills: 'TypeScript',
    })
    assert.equal(weak.success, false)
  })
})

describe('changePasswordSchema', () => {
  it('requires a new password of at least 8 characters', () => {
    assert.equal(
      changePasswordSchema.safeParse({
        currentPassword: 'TempPass12',
        newPassword: 'NewPass99',
      }).success,
      true,
    )
    assert.equal(
      changePasswordSchema.safeParse({
        currentPassword: 'TempPass12',
        newPassword: 'short',
      }).success,
      false,
    )
  })
})
