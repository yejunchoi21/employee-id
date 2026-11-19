import { Router } from 'express'
import {
  requireAdmin,
  requireAuth,
  requireFreshPassword,
} from '../middleware/requireAuth.js'
import {
  createEmployeeAccount,
  EmployeeAccountError,
} from '../services/createEmployeeAccount.js'
import { createEmployeeAccountSchema } from '../validation/employeeAccount.js'

export const adminAccountsRouter = Router()

adminAccountsRouter.post(
  '/api/admin/employee-accounts',
  requireAuth,
  requireFreshPassword,
  requireAdmin,
  async (req, res, next) => {
    try {
      const membership = req.membership!
      const parsed = createEmployeeAccountSchema.safeParse(req.body)
      if (!parsed.success) {
        res.status(400).json({
          ok: false,
          error:
            parsed.error.issues[0]?.message ?? 'Invalid employee account data.',
        })
        return
      }

      try {
        const created = await createEmployeeAccount({
          companyId: membership.companyId,
          createdByMembershipId: membership.membershipId,
          ...parsed.data,
        })

        res.status(201).json({
          ok: true,
          membership: created.membership,
          employee: created.employee,
          linkedExistingProfile: created.linkedExistingProfile,
        })
      } catch (error) {
        if (error instanceof EmployeeAccountError) {
          res.status(error.status).json({ ok: false, error: error.message })
          return
        }
        throw error
      }
    } catch (error) {
      next(error)
    }
  },
)
