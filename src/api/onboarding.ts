import { apiRequest } from './client'

export type TaskResponsible = 'new_hire' | 'manager'

export interface OnboardingEmployeeBrief {
  id: string
  name: string
  email: string
  title: string
  employeeCode: string
}

export interface OnboardingTaskDto {
  id: string
  title: string
  instructions: string | null
  dueDate: string | null
  responsible: TaskResponsible
  completedAt: string | null
  completedByMembershipId: string | null
  completedByName: string | null
  sortOrder: number
}

export interface OnboardingProgress {
  total: number
  completed: number
  remaining: number
  overdue: number
  percent: number
}

export interface OnboardingPlanDto {
  id: string
  employeeId: string
  managerEmployeeId: string
  buddyEmployeeId: string | null
  keyContactEmployeeIds: string[]
  startDate: string
  employee: OnboardingEmployeeBrief | null
  manager: OnboardingEmployeeBrief | null
  buddy: OnboardingEmployeeBrief | null
  keyContacts: Array<OnboardingEmployeeBrief | null>
  tasks: OnboardingTaskDto[]
  progress: OnboardingProgress
}

export async function fetchOnboardingDefaults() {
  return apiRequest<{
    ok: true
    tasks: Array<{
      title: string
      instructions: string
      responsible: TaskResponsible
      dueOffsetDays: number
    }>
  }>('/api/onboarding/defaults')
}

export async function fetchOnboardingPlans(
  scope: 'mine' | 'managed' | 'all',
) {
  return apiRequest<{ ok: true; plans: OnboardingPlanDto[] }>(
    `/api/onboarding/plans?scope=${scope}`,
  )
}

export async function fetchOnboardingPlan(planId: string) {
  return apiRequest<{
    ok: true
    role: 'admin' | 'new_hire' | 'manager' | 'none'
    plan: OnboardingPlanDto
  }>(`/api/onboarding/plans/${planId}`)
}

export async function createOnboardingPlan(input: {
  employeeId: string
  managerEmployeeId: string
  buddyEmployeeId?: string | null
  keyContactEmployeeIds: string[]
  startDate: string
}) {
  return apiRequest<{ ok: true; plan: OnboardingPlanDto }>(
    '/api/onboarding/plans',
    {
      method: 'POST',
      body: JSON.stringify(input),
    },
  )
}

export async function addOnboardingTask(
  planId: string,
  input: {
    title: string
    instructions?: string | null
    dueDate?: string | null
    responsible: TaskResponsible
  },
) {
  return apiRequest<{ ok: true; plan: OnboardingPlanDto }>(
    `/api/onboarding/plans/${planId}/tasks`,
    {
      method: 'POST',
      body: JSON.stringify(input),
    },
  )
}

export async function updateOnboardingTask(
  planId: string,
  taskId: string,
  input: {
    title: string
    instructions?: string | null
    dueDate?: string | null
    responsible: TaskResponsible
  },
) {
  return apiRequest<{ ok: true; plan: OnboardingPlanDto }>(
    `/api/onboarding/plans/${planId}/tasks/${taskId}`,
    {
      method: 'PATCH',
      body: JSON.stringify(input),
    },
  )
}

export async function completeOnboardingTask(planId: string, taskId: string) {
  return apiRequest<{ ok: true; plan: OnboardingPlanDto }>(
    `/api/onboarding/plans/${planId}/tasks/${taskId}/complete`,
    { method: 'POST' },
  )
}

export async function reopenOnboardingTask(planId: string, taskId: string) {
  return apiRequest<{ ok: true; plan: OnboardingPlanDto }>(
    `/api/onboarding/plans/${planId}/tasks/${taskId}/reopen`,
    { method: 'POST' },
  )
}
