import { z } from 'zod'

export const employeeSubmissionSchema = z.object({
  departmentId: z.string().min(1),
  name: z.string().trim().min(1).max(120),
  title: z.string().trim().min(1).max(120),
  office: z.string().trim().min(1).max(120),
  joined: z.string().trim().min(1).max(40),
  phone: z.string().trim().min(1).max(40),
  manager: z.string().trim().min(1).max(120),
  bio: z.string().trim().min(1).max(2000),
  skills: z
    .union([
      z.array(z.string().trim().min(1)).min(1),
      z.string().trim().min(1),
    ])
    .transform((value) => {
      const list = Array.isArray(value)
        ? value
        : value.split(',').map((skill) => skill.trim())
      return [...new Set(list.filter(Boolean))]
    })
    .refine((skills) => skills.length > 0, 'Add at least one skill.'),
})

export const approvalDecisionSchema = z.object({
  decision: z.enum(['approve', 'reject']),
})
