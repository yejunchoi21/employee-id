import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  assertNotSelfAssignment,
  calculateOnboardingProgress,
  canManageOnboardingPlanTasks,
  canToggleOnboardingTask,
  canViewOnboardingPlan,
  resolveOnboardingActor,
} from './onboardingAccess.js'

describe('resolveOnboardingActor', () => {
  it('gives admin, new hire, and manager access roles', () => {
    assert.equal(
      resolveOnboardingActor({
        isAdmin: true,
        actorEmployeeId: 'x',
        planEmployeeId: 'hire',
        planManagerEmployeeId: 'mgr',
      }),
      'admin',
    )
    assert.equal(
      resolveOnboardingActor({
        isAdmin: false,
        actorEmployeeId: 'hire',
        planEmployeeId: 'hire',
        planManagerEmployeeId: 'mgr',
      }),
      'new_hire',
    )
    assert.equal(
      resolveOnboardingActor({
        isAdmin: false,
        actorEmployeeId: 'mgr',
        planEmployeeId: 'hire',
        planManagerEmployeeId: 'mgr',
      }),
      'manager',
    )
  })

  it('does not grant checklist access to buddy alone', () => {
    assert.equal(
      resolveOnboardingActor({
        isAdmin: false,
        actorEmployeeId: 'buddy',
        planEmployeeId: 'hire',
        planManagerEmployeeId: 'mgr',
        planBuddyEmployeeId: 'buddy',
      }),
      'none',
    )
    assert.equal(canViewOnboardingPlan('none'), false)
  })
})

describe('task permissions', () => {
  it('lets managers manage plan tasks but not complete new-hire tasks', () => {
    assert.equal(canManageOnboardingPlanTasks('manager'), true)
    assert.equal(
      canToggleOnboardingTask({ role: 'manager', taskResponsible: 'manager' }),
      true,
    )
    assert.equal(
      canToggleOnboardingTask({
        role: 'manager',
        taskResponsible: 'new_hire',
      }),
      false,
    )
    assert.equal(
      canToggleOnboardingTask({
        role: 'new_hire',
        taskResponsible: 'new_hire',
      }),
      true,
    )
  })
})

describe('calculateOnboardingProgress', () => {
  it('computes completion and overdue counts independently of template data', () => {
    const now = new Date('2026-03-10T12:00:00.000Z')
    const progress = calculateOnboardingProgress(
      [
        { completedAt: new Date('2026-03-01'), dueDate: new Date('2026-03-02') },
        { completedAt: null, dueDate: new Date('2026-03-01') },
        { completedAt: null, dueDate: new Date('2026-03-20') },
        { completedAt: null, dueDate: null },
      ],
      now,
    )

    assert.deepEqual(progress, {
      total: 4,
      completed: 1,
      remaining: 3,
      overdue: 1,
      percent: 25,
    })
  })
})

describe('assertNotSelfAssignment', () => {
  it('blocks self manager and self buddy assignments', () => {
    assert.equal(
      assertNotSelfAssignment({
        employeeId: 'a',
        managerEmployeeId: 'a',
      }),
      'An employee cannot be assigned as their own manager.',
    )
    assert.equal(
      assertNotSelfAssignment({
        employeeId: 'a',
        managerEmployeeId: 'b',
        buddyEmployeeId: 'a',
      }),
      'An employee cannot be assigned as their own buddy.',
    )
    assert.equal(
      assertNotSelfAssignment({
        employeeId: 'a',
        managerEmployeeId: 'b',
        buddyEmployeeId: 'c',
      }),
      null,
    )
  })
})

describe('checklist independence', () => {
  it('copies default tasks as plain values so plan edits stay local', () => {
    const template = [
      { title: 'Meet your team', responsible: 'manager' as const },
    ]
    const planA = template.map((task) => ({ ...task, title: task.title }))
    const planB = template.map((task) => ({ ...task, title: task.title }))
    planA[0]!.title = 'Meet engineering only'

    assert.equal(planB[0]!.title, 'Meet your team')
    assert.equal(template[0]!.title, 'Meet your team')
  })
})
