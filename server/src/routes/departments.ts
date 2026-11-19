import { Router } from 'express'
import { requireAuth } from '../middleware/requireAuth.js'
import { ensureDefaultDepartments } from '../services/ensureDefaultDepartments.js'

export const departmentsRouter = Router()

departmentsRouter.get('/api/departments', requireAuth, async (req, res, next) => {
  try {
    const membership = req.membership!
    const departments = await ensureDefaultDepartments(membership.companyId)

    res.json({
      ok: true,
      departments: departments.map((department) => ({
        id: String(department._id),
        name: department.name,
        companyId: String(department.companyId),
      })),
    })
  } catch (error) {
    next(error)
  }
})
