import { z } from 'zod'

const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters.')
  .max(128, 'Password must be 128 characters or fewer.')

export const createEmployeeAccountSchema = z.object({
  email: z.string().email().transform((value) => value.trim().toLowerCase()),
  displayName: z.string().trim().min(1).max(120),
  initialPassword: passwordSchema,
  departmentId: z.string().min(1),
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

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: passwordSchema,
})
