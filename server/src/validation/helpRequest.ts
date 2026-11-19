import { z } from 'zod'
import {
  helpRequestPriorities,
  helpRequestStatuses,
} from '../models/HelpRequest.js'

export const createHelpRequestSchema = z.object({
  recipientEmployeeId: z.string().min(1, 'recipientEmployeeId is required.'),
  subject: z
    .string()
    .trim()
    .min(1, 'Subject is required.')
    .max(160, 'Subject must be 160 characters or fewer.'),
  question: z
    .string()
    .trim()
    .min(1, 'Question is required.')
    .max(4000, 'Question must be 4000 characters or fewer.'),
  priority: z.enum(helpRequestPriorities).default('normal'),
})

export const helpRequestDecisionSchema = z.object({
  response: z
    .string()
    .trim()
    .max(4000, 'Response must be 4000 characters or fewer.')
    .optional(),
})

export const helpRequestListQuerySchema = z.object({
  box: z.enum(['sent', 'received']).default('received'),
  status: z.enum(['all', ...helpRequestStatuses]).default('all'),
})
