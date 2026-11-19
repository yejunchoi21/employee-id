import { z } from 'zod'
import { taskResponsibleRoles } from '../constants/defaultOnboardingTasks.js'

const objectIdString = z.string().min(1)

export const createOnboardingPlanSchema = z.object({
  employeeId: objectIdString,
  managerEmployeeId: objectIdString,
  buddyEmployeeId: objectIdString.optional().nullable(),
  keyContactEmployeeIds: z.array(objectIdString).max(12).default([]),
  startDate: z.string().min(1),
})

export const updateOnboardingPlanSchema = z.object({
  managerEmployeeId: objectIdString.optional(),
  buddyEmployeeId: objectIdString.nullable().optional(),
  keyContactEmployeeIds: z.array(objectIdString).max(12).optional(),
  startDate: z.string().min(1).optional(),
})

export const upsertOnboardingTaskSchema = z.object({
  title: z.string().trim().min(1).max(160),
  instructions: z.string().trim().max(2000).optional().nullable(),
  dueDate: z.string().optional().nullable(),
  responsible: z.enum(taskResponsibleRoles),
})
