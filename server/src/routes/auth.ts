import { Router } from 'express'
import { z } from 'zod'
import { hashPassword, verifyPassword } from '../auth/password.js'
import {
  clearSessionCookie,
  createSessionToken,
  setSessionCookie,
  toPublicMembership,
} from '../auth/session.js'
import { requireAuth } from '../middleware/requireAuth.js'
import { Membership } from '../models/index.js'
import { changePasswordSchema } from '../validation/employeeAccount.js'
import type { AuthenticatedMembership } from '../types/express.js'

export const authRouter = Router()

const loginSchema = z.object({
  email: z.string().email().transform((value) => value.trim().toLowerCase()),
  password: z.string().min(8),
})

function toAuthMembership(membership: {
  _id: AuthenticatedMembership['membershipId']
  companyId: AuthenticatedMembership['companyId']
  email: string
  displayName: string
  role: AuthenticatedMembership['role']
  employeeId?: AuthenticatedMembership['employeeId']
  mustChangePassword?: boolean | null
}): AuthenticatedMembership {
  return {
    membershipId: membership._id,
    companyId: membership.companyId,
    email: membership.email,
    displayName: membership.displayName,
    role: membership.role,
    employeeId: membership.employeeId ?? null,
    mustChangePassword: Boolean(membership.mustChangePassword),
  }
}

authRouter.post('/api/auth/login', async (req, res, next) => {
  try {
    const parsed = loginSchema.safeParse(req.body)
    if (!parsed.success) {
      res.status(400).json({ ok: false, error: 'Valid email and password required.' })
      return
    }

    const membership = await Membership.findOne({ email: parsed.data.email })
      .select('+passwordHash')
      .lean()

    if (!membership?.passwordHash) {
      res.status(401).json({ ok: false, error: 'Invalid email or password.' })
      return
    }

    const valid = await verifyPassword(
      parsed.data.password,
      membership.passwordHash,
    )
    if (!valid) {
      res.status(401).json({ ok: false, error: 'Invalid email or password.' })
      return
    }

    const authMembership = toAuthMembership(membership)
    const token = await createSessionToken(authMembership)
    setSessionCookie(res, token)

    res.json({
      ok: true,
      membership: toPublicMembership(authMembership),
    })
  } catch (error) {
    next(error)
  }
})

authRouter.post('/api/auth/logout', (_req, res) => {
  clearSessionCookie(res)
  res.json({ ok: true })
})

authRouter.get('/api/auth/me', requireAuth, (req, res) => {
  res.json({
    ok: true,
    membership: toPublicMembership(req.membership!),
  })
})

authRouter.post('/api/auth/change-password', requireAuth, async (req, res, next) => {
  try {
    const membership = req.membership!
    const parsed = changePasswordSchema.safeParse(req.body)
    if (!parsed.success) {
      res.status(400).json({
        ok: false,
        error: parsed.error.issues[0]?.message ?? 'Invalid password change.',
      })
      return
    }

    if (parsed.data.currentPassword === parsed.data.newPassword) {
      res.status(400).json({
        ok: false,
        error: 'New password must be different from the current password.',
      })
      return
    }

    const record = await Membership.findById(membership.membershipId).select(
      '+passwordHash',
    )
    if (!record?.passwordHash) {
      res.status(401).json({ ok: false, error: 'Authentication required.' })
      return
    }

    const valid = await verifyPassword(
      parsed.data.currentPassword,
      record.passwordHash,
    )
    if (!valid) {
      res.status(401).json({ ok: false, error: 'Current password is incorrect.' })
      return
    }

    record.passwordHash = await hashPassword(parsed.data.newPassword)
    record.mustChangePassword = false
    await record.save()

    const authMembership = toAuthMembership(record)
    const token = await createSessionToken(authMembership)
    setSessionCookie(res, token)

    res.json({
      ok: true,
      membership: toPublicMembership(authMembership),
    })
  } catch (error) {
    next(error)
  }
})
