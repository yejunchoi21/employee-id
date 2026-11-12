import { Router } from 'express'
import { z } from 'zod'
import { verifyPassword } from '../auth/password.js'
import {
  clearSessionCookie,
  createSessionToken,
  setSessionCookie,
  toPublicMembership,
} from '../auth/session.js'
import { requireAuth } from '../middleware/requireAuth.js'
import { Membership } from '../models/index.js'

export const authRouter = Router()

const loginSchema = z.object({
  email: z.string().email().transform((value) => value.trim().toLowerCase()),
  password: z.string().min(8),
})

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

    const authMembership = {
      membershipId: membership._id,
      companyId: membership.companyId,
      email: membership.email,
      displayName: membership.displayName,
      role: membership.role,
    }

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
