import type { NextFunction, Request, Response } from 'express'
import { env } from '../config/env.js'
import { verifySessionToken } from '../auth/session.js'
import { Membership } from '../models/index.js'

/**
 * Requires a valid session cookie and re-checks that the membership
 * still exists. Attaches company-scoped identity to req.membership.
 */
export async function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const token = req.cookies?.[env.AUTH_COOKIE_NAME]
    if (!token || typeof token !== 'string') {
      res.status(401).json({ ok: false, error: 'Authentication required.' })
      return
    }

    const session = await verifySessionToken(token)
    if (!session) {
      res.status(401).json({ ok: false, error: 'Invalid or expired session.' })
      return
    }

    const membership = await Membership.findById(session.membershipId).lean()
    if (!membership) {
      res.status(401).json({ ok: false, error: 'Membership no longer exists.' })
      return
    }

    req.membership = {
      membershipId: membership._id,
      companyId: membership.companyId,
      email: membership.email,
      displayName: membership.displayName,
      role: membership.role,
    }

    next()
  } catch (error) {
    next(error)
  }
}

export function requireAdmin(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  if (!req.membership) {
    res.status(401).json({ ok: false, error: 'Authentication required.' })
    return
  }

  if (req.membership.role !== 'admin') {
    res.status(403).json({ ok: false, error: 'Admin role required.' })
    return
  }

  next()
}
