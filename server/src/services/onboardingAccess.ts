import type { Types } from 'mongoose'

export type OnboardingActorRole = 'admin' | 'new_hire' | 'manager' | 'none'

export function resolveOnboardingActor(input: {
  isAdmin: boolean
  actorEmployeeId: string | null
  planEmployeeId: string
  planManagerEmployeeId: string
  planBuddyEmployeeId?: string | null
}): OnboardingActorRole {
  if (input.isAdmin) return 'admin'

  if (
    input.actorEmployeeId &&
    input.actorEmployeeId === input.planEmployeeId
  ) {
    return 'new_hire'
  }

  if (
    input.actorEmployeeId &&
    input.actorEmployeeId === input.planManagerEmployeeId
  ) {
    return 'manager'
  }

  // Buddy assignment alone must not grant checklist access.
  void input.planBuddyEmployeeId
  return 'none'
}

export function canViewOnboardingPlan(role: OnboardingActorRole) {
  return role === 'admin' || role === 'new_hire' || role === 'manager'
}

export function canManageOnboardingPlanTasks(role: OnboardingActorRole) {
  return role === 'admin' || role === 'manager'
}

export function canToggleOnboardingTask(input: {
  role: OnboardingActorRole
  taskResponsible: 'new_hire' | 'manager'
}) {
  if (input.role === 'admin') return true
  if (input.role === 'new_hire' && input.taskResponsible === 'new_hire') {
    return true
  }
  if (input.role === 'manager' && input.taskResponsible === 'manager') {
    return true
  }
  return false
}

export function calculateOnboardingProgress(
  tasks: Array<{ completedAt?: Date | null; dueDate?: Date | null }>,
  now = new Date(),
) {
  const total = tasks.length
  const completed = tasks.filter((task) => Boolean(task.completedAt)).length
  const overdue = tasks.filter((task) => {
    if (task.completedAt || !task.dueDate) return false
    return task.dueDate.getTime() < now.getTime()
  }).length
  const percent = total === 0 ? 0 : Math.round((completed / total) * 100)

  return {
    total,
    completed,
    remaining: Math.max(total - completed, 0),
    overdue,
    percent,
  }
}

export function assertNotSelfAssignment(input: {
  employeeId: string
  managerEmployeeId: string
  buddyEmployeeId?: string | null
}) {
  if (input.employeeId === input.managerEmployeeId) {
    return 'An employee cannot be assigned as their own manager.'
  }
  if (input.buddyEmployeeId && input.employeeId === input.buddyEmployeeId) {
    return 'An employee cannot be assigned as their own buddy.'
  }
  return null
}

export function idsEqual(
  left: Types.ObjectId | string | null | undefined,
  right: Types.ObjectId | string | null | undefined,
) {
  if (!left || !right) return false
  return String(left) === String(right)
}
