import { Types } from 'mongoose'
import { defaultOnboardingTasks } from '../constants/defaultOnboardingTasks.js'
import { Employee, Membership, OnboardingPlan } from '../models/index.js'
import {
  assertNotSelfAssignment,
  canManageOnboardingPlanTasks,
  canToggleOnboardingTask,
  canViewOnboardingPlan,
  resolveOnboardingActor,
  type OnboardingActorRole,
} from './onboardingAccess.js'
import { presentOnboardingPlan } from '../utils/onboardingPresenters.js'

export class OnboardingError extends Error {
  status: number

  constructor(message: string, status: number) {
    super(message)
    this.name = 'OnboardingError'
    this.status = status
  }
}

function parseDate(value: string, label: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    throw new OnboardingError(`Invalid ${label}.`, 400)
  }
  return date
}

function addDays(start: Date, days: number) {
  const next = new Date(start)
  next.setUTCDate(next.getUTCDate() + days)
  return next
}

async function requireApprovedEmployee(
  companyId: Types.ObjectId,
  employeeId: string,
  label: string,
) {
  if (!Types.ObjectId.isValid(employeeId)) {
    throw new OnboardingError(`Invalid ${label}.`, 400)
  }

  const employee = await Employee.findOne({
    _id: employeeId,
    companyId,
    approvalStatus: 'approved',
  }).lean()

  if (!employee) {
    throw new OnboardingError(
      `${label} must be an active employee in your company.`,
      400,
    )
  }

  return employee
}

async function loadPlanOrThrow(companyId: Types.ObjectId, planId: string) {
  if (!Types.ObjectId.isValid(planId)) {
    throw new OnboardingError('Invalid onboarding plan id.', 400)
  }

  const plan = await OnboardingPlan.findOne({
    _id: planId,
    companyId,
  })

  if (!plan) {
    throw new OnboardingError('Onboarding plan not found.', 404)
  }

  return plan
}

export async function enrichOnboardingPlan(plan: {
  _id: Types.ObjectId
  companyId: Types.ObjectId
  employeeId: Types.ObjectId
  managerEmployeeId: Types.ObjectId
  buddyEmployeeId?: Types.ObjectId | null
  keyContactEmployeeIds?: Types.ObjectId[]
  startDate: Date
  createdByMembershipId: Types.ObjectId
  tasks: Array<{
    _id: Types.ObjectId
    title: string
    instructions?: string | null
    dueDate?: Date | null
    responsible: 'new_hire' | 'manager'
    completedAt?: Date | null
    completedByMembershipId?: Types.ObjectId | null
    sortOrder: number
  }>
  createdAt?: Date
  updatedAt?: Date
}) {
  const contactIds = plan.keyContactEmployeeIds ?? []
  const employeeIds = [
    plan.employeeId,
    plan.managerEmployeeId,
    ...(plan.buddyEmployeeId ? [plan.buddyEmployeeId] : []),
    ...contactIds,
  ]

  const membershipIds = plan.tasks
    .map((task) => task.completedByMembershipId)
    .filter((id): id is Types.ObjectId => Boolean(id))

  const [employees, memberships] = await Promise.all([
    Employee.find({ _id: { $in: employeeIds } })
      .select({ name: 1, email: 1, title: 1, employeeCode: 1 })
      .lean(),
    membershipIds.length
      ? Membership.find({ _id: { $in: membershipIds } })
          .select({ displayName: 1 })
          .lean()
      : Promise.resolve([]),
  ])

  const byId = new Map(employees.map((employee) => [String(employee._id), employee]))
  const completedByNames = Object.fromEntries(
    memberships.map((membership) => [
      String(membership._id),
      membership.displayName,
    ]),
  )

  return presentOnboardingPlan(plan, {
    employee: byId.get(String(plan.employeeId)),
    manager: byId.get(String(plan.managerEmployeeId)),
    buddy: plan.buddyEmployeeId
      ? byId.get(String(plan.buddyEmployeeId))
      : null,
    keyContacts: contactIds
      .map((id) => byId.get(String(id)))
      .filter((employee): employee is NonNullable<typeof employee> =>
        Boolean(employee),
      ),
    completedByNames,
  })
}

export function actorForPlan(input: {
  isAdmin: boolean
  actorEmployeeId: Types.ObjectId | null
  plan: {
    employeeId: Types.ObjectId
    managerEmployeeId: Types.ObjectId
    buddyEmployeeId?: Types.ObjectId | null
  }
}): OnboardingActorRole {
  return resolveOnboardingActor({
    isAdmin: input.isAdmin,
    actorEmployeeId: input.actorEmployeeId
      ? String(input.actorEmployeeId)
      : null,
    planEmployeeId: String(input.plan.employeeId),
    planManagerEmployeeId: String(input.plan.managerEmployeeId),
    planBuddyEmployeeId: input.plan.buddyEmployeeId
      ? String(input.plan.buddyEmployeeId)
      : null,
  })
}

export async function createOnboardingPlan(input: {
  companyId: Types.ObjectId
  createdByMembershipId: Types.ObjectId
  employeeId: string
  managerEmployeeId: string
  buddyEmployeeId?: string | null
  keyContactEmployeeIds: string[]
  startDate: string
}) {
  const selfError = assertNotSelfAssignment({
    employeeId: input.employeeId,
    managerEmployeeId: input.managerEmployeeId,
    buddyEmployeeId: input.buddyEmployeeId,
  })
  if (selfError) throw new OnboardingError(selfError, 400)

  const startDate = parseDate(input.startDate, 'start date')

  const [employee, manager] = await Promise.all([
    requireApprovedEmployee(input.companyId, input.employeeId, 'New hire'),
    requireApprovedEmployee(
      input.companyId,
      input.managerEmployeeId,
      'Manager',
    ),
  ])

  let buddy = null
  if (input.buddyEmployeeId) {
    buddy = await requireApprovedEmployee(
      input.companyId,
      input.buddyEmployeeId,
      'Buddy',
    )
  }

  const uniqueContactIds = [
    ...new Set(input.keyContactEmployeeIds.map(String)),
  ].filter(
    (id) =>
      id !== String(employee._id) &&
      id !== String(manager._id) &&
      id !== (buddy ? String(buddy._id) : ''),
  )

  const contacts = await Promise.all(
    uniqueContactIds.map((id) =>
      requireApprovedEmployee(input.companyId, id, 'Key contact'),
    ),
  )

  const existing = await OnboardingPlan.findOne({
    companyId: input.companyId,
    employeeId: employee._id,
  }).lean()
  if (existing) {
    throw new OnboardingError(
      'An onboarding plan already exists for this employee.',
      409,
    )
  }

  // Copy template tasks into this plan only.
  const tasks = defaultOnboardingTasks.map((task, index) => ({
    title: task.title,
    instructions: task.instructions,
    responsible: task.responsible,
    dueDate: addDays(startDate, task.dueOffsetDays),
    sortOrder: index,
  }))

  const plan = await OnboardingPlan.create({
    companyId: input.companyId,
    employeeId: employee._id,
    managerEmployeeId: manager._id,
    buddyEmployeeId: buddy?._id,
    keyContactEmployeeIds: contacts.map((contact) => contact._id),
    startDate,
    createdByMembershipId: input.createdByMembershipId,
    tasks,
  })

  return enrichOnboardingPlan(plan.toObject())
}

export async function listOnboardingPlansForActor(input: {
  companyId: Types.ObjectId
  isAdmin: boolean
  actorEmployeeId: Types.ObjectId | null
  scope: 'mine' | 'managed' | 'all'
}) {
  if (input.scope === 'all' && !input.isAdmin) {
    throw new OnboardingError('Admin role required.', 403)
  }

  if (input.scope === 'mine' || input.scope === 'managed') {
    if (!input.actorEmployeeId) {
      return []
    }
  }

  const filter: Record<string, unknown> = { companyId: input.companyId }
  if (input.scope === 'mine') {
    filter.employeeId = input.actorEmployeeId
  } else if (input.scope === 'managed') {
    filter.managerEmployeeId = input.actorEmployeeId
  }

  const plans = await OnboardingPlan.find(filter)
    .sort({ startDate: -1 })
    .lean()

  return Promise.all(plans.map((plan) => enrichOnboardingPlan(plan)))
}

export async function getOnboardingPlanForActor(input: {
  companyId: Types.ObjectId
  planId: string
  isAdmin: boolean
  actorEmployeeId: Types.ObjectId | null
}) {
  const plan = await loadPlanOrThrow(input.companyId, input.planId)
  const role = actorForPlan({
    isAdmin: input.isAdmin,
    actorEmployeeId: input.actorEmployeeId,
    plan,
  })

  if (!canViewOnboardingPlan(role)) {
    throw new OnboardingError(
      'You do not have access to this onboarding plan.',
      403,
    )
  }

  return {
    role,
    plan: await enrichOnboardingPlan(plan.toObject()),
  }
}

export async function updateOnboardingPlan(input: {
  companyId: Types.ObjectId
  planId: string
  isAdmin: boolean
  actorEmployeeId: Types.ObjectId | null
  managerEmployeeId?: string
  buddyEmployeeId?: string | null
  keyContactEmployeeIds?: string[]
  startDate?: string
}) {
  const plan = await loadPlanOrThrow(input.companyId, input.planId)
  const role = actorForPlan({
    isAdmin: input.isAdmin,
    actorEmployeeId: input.actorEmployeeId,
    plan,
  })

  if (role !== 'admin') {
    throw new OnboardingError('Only admins can update plan assignments.', 403)
  }

  const nextManagerId = input.managerEmployeeId ?? String(plan.managerEmployeeId)
  const nextBuddyId =
    input.buddyEmployeeId === undefined
      ? plan.buddyEmployeeId
        ? String(plan.buddyEmployeeId)
        : null
      : input.buddyEmployeeId

  const selfError = assertNotSelfAssignment({
    employeeId: String(plan.employeeId),
    managerEmployeeId: nextManagerId,
    buddyEmployeeId: nextBuddyId,
  })
  if (selfError) throw new OnboardingError(selfError, 400)

  const manager = await requireApprovedEmployee(
    input.companyId,
    nextManagerId,
    'Manager',
  )
  plan.managerEmployeeId = manager._id

  if (input.buddyEmployeeId !== undefined) {
    if (input.buddyEmployeeId) {
      const buddy = await requireApprovedEmployee(
        input.companyId,
        input.buddyEmployeeId,
        'Buddy',
      )
      plan.buddyEmployeeId = buddy._id
    } else {
      plan.buddyEmployeeId = undefined
    }
  }

  if (input.keyContactEmployeeIds) {
    const contacts = await Promise.all(
      [...new Set(input.keyContactEmployeeIds)].map((id) =>
        requireApprovedEmployee(input.companyId, id, 'Key contact'),
      ),
    )
    plan.keyContactEmployeeIds = contacts.map((contact) => contact._id)
  }

  if (input.startDate) {
    plan.startDate = parseDate(input.startDate, 'start date')
  }

  await plan.save()
  return enrichOnboardingPlan(plan.toObject())
}

export async function addOnboardingTask(input: {
  companyId: Types.ObjectId
  planId: string
  isAdmin: boolean
  actorEmployeeId: Types.ObjectId | null
  title: string
  instructions?: string | null
  dueDate?: string | null
  responsible: 'new_hire' | 'manager'
}) {
  const plan = await loadPlanOrThrow(input.companyId, input.planId)
  const role = actorForPlan({
    isAdmin: input.isAdmin,
    actorEmployeeId: input.actorEmployeeId,
    plan,
  })

  if (!canManageOnboardingPlanTasks(role)) {
    throw new OnboardingError(
      'Only the assigned manager or an admin can add tasks.',
      403,
    )
  }

  const sortOrder =
    plan.tasks.reduce((max, task) => Math.max(max, task.sortOrder), -1) + 1

  plan.tasks.push({
    title: input.title.trim(),
    instructions: input.instructions?.trim() || undefined,
    dueDate: input.dueDate ? parseDate(input.dueDate, 'due date') : undefined,
    responsible: input.responsible,
    sortOrder,
  })

  await plan.save()
  return enrichOnboardingPlan(plan.toObject())
}

export async function updateOnboardingTask(input: {
  companyId: Types.ObjectId
  planId: string
  taskId: string
  isAdmin: boolean
  actorEmployeeId: Types.ObjectId | null
  title: string
  instructions?: string | null
  dueDate?: string | null
  responsible: 'new_hire' | 'manager'
}) {
  const plan = await loadPlanOrThrow(input.companyId, input.planId)
  const role = actorForPlan({
    isAdmin: input.isAdmin,
    actorEmployeeId: input.actorEmployeeId,
    plan,
  })

  if (!canManageOnboardingPlanTasks(role)) {
    throw new OnboardingError(
      'Only the assigned manager or an admin can edit tasks.',
      403,
    )
  }

  const task = plan.tasks.id(input.taskId)
  if (!task) {
    throw new OnboardingError('Task not found.', 404)
  }

  task.title = input.title.trim()
  task.instructions = input.instructions?.trim() || undefined
  task.responsible = input.responsible
  task.dueDate = input.dueDate
    ? parseDate(input.dueDate, 'due date')
    : undefined

  await plan.save()
  return enrichOnboardingPlan(plan.toObject())
}

export async function setOnboardingTaskCompletion(input: {
  companyId: Types.ObjectId
  planId: string
  taskId: string
  isAdmin: boolean
  actorEmployeeId: Types.ObjectId | null
  actorMembershipId: Types.ObjectId
  complete: boolean
}) {
  const plan = await loadPlanOrThrow(input.companyId, input.planId)
  const role = actorForPlan({
    isAdmin: input.isAdmin,
    actorEmployeeId: input.actorEmployeeId,
    plan,
  })

  const task = plan.tasks.id(input.taskId)
  if (!task) {
    throw new OnboardingError('Task not found.', 404)
  }

  if (
    !canToggleOnboardingTask({
      role,
      taskResponsible: task.responsible,
    })
  ) {
    throw new OnboardingError(
      'Only the task owner (or an admin) can update this task.',
      403,
    )
  }

  if (input.complete) {
    task.completedAt = new Date()
    task.completedByMembershipId = input.actorMembershipId
  } else {
    task.completedAt = undefined
    task.completedByMembershipId = undefined
  }

  await plan.save()
  return enrichOnboardingPlan(plan.toObject())
}
