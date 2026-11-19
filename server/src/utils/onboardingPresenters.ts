import type { Types } from 'mongoose'
import { calculateOnboardingProgress } from '../services/onboardingAccess.js'

type EmployeeBrief = {
  _id: Types.ObjectId
  name: string
  email: string
  title: string
  employeeCode: string
}

type TaskLean = {
  _id: Types.ObjectId
  title: string
  instructions?: string | null
  dueDate?: Date | null
  responsible: 'new_hire' | 'manager'
  completedAt?: Date | null
  completedByMembershipId?: Types.ObjectId | null
  sortOrder: number
}

type PlanLean = {
  _id: Types.ObjectId
  companyId: Types.ObjectId
  employeeId: Types.ObjectId
  managerEmployeeId: Types.ObjectId
  buddyEmployeeId?: Types.ObjectId | null
  keyContactEmployeeIds?: Types.ObjectId[]
  startDate: Date
  createdByMembershipId: Types.ObjectId
  tasks: TaskLean[]
  createdAt?: Date
  updatedAt?: Date
}

function presentEmployeeBrief(employee?: EmployeeBrief | null) {
  if (!employee) return null
  return {
    id: String(employee._id),
    name: employee.name,
    email: employee.email,
    title: employee.title,
    employeeCode: employee.employeeCode,
  }
}

export function presentOnboardingTask(
  task: TaskLean,
  completedByName?: string | null,
) {
  return {
    id: String(task._id),
    title: task.title,
    instructions: task.instructions?.trim() ? task.instructions : null,
    dueDate: task.dueDate?.toISOString() ?? null,
    responsible: task.responsible,
    completedAt: task.completedAt?.toISOString() ?? null,
    completedByMembershipId: task.completedByMembershipId
      ? String(task.completedByMembershipId)
      : null,
    completedByName: completedByName ?? null,
    sortOrder: task.sortOrder,
  }
}

export function presentOnboardingPlan(
  plan: PlanLean,
  extras: {
    employee?: EmployeeBrief | null
    manager?: EmployeeBrief | null
    buddy?: EmployeeBrief | null
    keyContacts?: EmployeeBrief[]
    completedByNames?: Record<string, string>
  } = {},
) {
  const tasks = [...plan.tasks]
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((task) =>
      presentOnboardingTask(
        task,
        extras.completedByNames?.[String(task.completedByMembershipId ?? '')],
      ),
    )

  return {
    id: String(plan._id),
    companyId: String(plan.companyId),
    employeeId: String(plan.employeeId),
    managerEmployeeId: String(plan.managerEmployeeId),
    buddyEmployeeId: plan.buddyEmployeeId
      ? String(plan.buddyEmployeeId)
      : null,
    keyContactEmployeeIds: (plan.keyContactEmployeeIds ?? []).map(String),
    startDate: plan.startDate.toISOString(),
    createdByMembershipId: String(plan.createdByMembershipId),
    createdAt: plan.createdAt?.toISOString() ?? null,
    updatedAt: plan.updatedAt?.toISOString() ?? null,
    employee: presentEmployeeBrief(extras.employee),
    manager: presentEmployeeBrief(extras.manager),
    buddy: presentEmployeeBrief(extras.buddy),
    keyContacts: (extras.keyContacts ?? []).map(presentEmployeeBrief),
    tasks,
    progress: calculateOnboardingProgress(plan.tasks),
  }
}
