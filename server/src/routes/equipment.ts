import { Router, type NextFunction, type Response } from 'express'
import {
  requireAdmin,
  requireAuth,
  requireFreshPassword,
} from '../middleware/requireAuth.js'
import {
  assignEquipment,
  createEquipmentRequest,
  createInventoryItem,
  decideEquipmentRequest,
  EquipmentError,
  fulfilEquipmentRequest,
  listAllAssignments,
  listAssignmentsForEmployee,
  listEquipmentRequests,
  listInventoryItems,
  returnEquipment,
  updateInventoryItem,
} from '../services/equipmentService.js'
import {
  assignEquipmentSchema,
  createEquipmentItemSchema,
  createEquipmentRequestSchema,
  decideEquipmentRequestSchema,
  fulfilEquipmentRequestSchema,
  returnEquipmentSchema,
  updateEquipmentItemSchema,
} from '../validation/equipment.js'
import {
  equipmentCategories,
  equipmentItemStatuses,
} from '../models/EquipmentItem.js'

export const equipmentRouter = Router()

function handleEquipmentError(
  error: unknown,
  res: Response,
  next: NextFunction,
) {
  if (error instanceof EquipmentError) {
    res.status(error.status).json({ ok: false, error: error.message })
    return
  }
  next(error)
}

equipmentRouter.get(
  '/api/equipment/items',
  requireAuth,
  requireFreshPassword,
  requireAdmin,
  async (req, res, next) => {
    try {
      const membership = req.membership!
      const search =
        typeof req.query.search === 'string' ? req.query.search : undefined
      const statusRaw =
        typeof req.query.status === 'string' ? req.query.status : 'all'
      const categoryRaw =
        typeof req.query.category === 'string' ? req.query.category : 'all'

      const status =
        statusRaw === 'all' ||
        (equipmentItemStatuses as readonly string[]).includes(statusRaw)
          ? (statusRaw as (typeof equipmentItemStatuses)[number] | 'all')
          : null
      const category =
        categoryRaw === 'all' ||
        (equipmentCategories as readonly string[]).includes(categoryRaw)
          ? (categoryRaw as (typeof equipmentCategories)[number] | 'all')
          : null

      if (!status || !category) {
        res.status(400).json({
          ok: false,
          error: 'Invalid status or category filter.',
        })
        return
      }

      const items = await listInventoryItems({
        companyId: membership.companyId,
        search,
        status,
        category,
      })
      res.json({ ok: true, items })
    } catch (error) {
      handleEquipmentError(error, res, next)
    }
  },
)

equipmentRouter.post(
  '/api/equipment/items',
  requireAuth,
  requireFreshPassword,
  requireAdmin,
  async (req, res, next) => {
    try {
      const membership = req.membership!
      const parsed = createEquipmentItemSchema.safeParse(req.body)
      if (!parsed.success) {
        res.status(400).json({
          ok: false,
          error: parsed.error.issues[0]?.message ?? 'Invalid equipment item.',
        })
        return
      }
      const item = await createInventoryItem({
        companyId: membership.companyId,
        ...parsed.data,
      })
      res.status(201).json({ ok: true, item })
    } catch (error) {
      handleEquipmentError(error, res, next)
    }
  },
)

equipmentRouter.patch(
  '/api/equipment/items/:itemId',
  requireAuth,
  requireFreshPassword,
  requireAdmin,
  async (req, res, next) => {
    try {
      const membership = req.membership!
      const itemId = Array.isArray(req.params.itemId)
        ? req.params.itemId[0]
        : req.params.itemId
      if (!itemId) {
        res.status(400).json({ ok: false, error: 'Invalid item id.' })
        return
      }
      const parsed = updateEquipmentItemSchema.safeParse(req.body)
      if (!parsed.success) {
        res.status(400).json({
          ok: false,
          error: parsed.error.issues[0]?.message ?? 'Invalid item update.',
        })
        return
      }
      const item = await updateInventoryItem({
        companyId: membership.companyId,
        itemId,
        ...parsed.data,
      })
      res.json({ ok: true, item })
    } catch (error) {
      handleEquipmentError(error, res, next)
    }
  },
)

equipmentRouter.post(
  '/api/equipment/requests',
  requireAuth,
  requireFreshPassword,
  async (req, res, next) => {
    try {
      const membership = req.membership!
      if (!membership.employeeId) {
        res.status(400).json({
          ok: false,
          error:
            'Your account is not linked to an employee profile, so you cannot request equipment.',
        })
        return
      }
      const parsed = createEquipmentRequestSchema.safeParse(req.body)
      if (!parsed.success) {
        res.status(400).json({
          ok: false,
          error: parsed.error.issues[0]?.message ?? 'Invalid request.',
        })
        return
      }
      const request = await createEquipmentRequest({
        companyId: membership.companyId,
        requesterEmployeeId: membership.employeeId,
        ...parsed.data,
      })
      res.status(201).json({ ok: true, request })
    } catch (error) {
      handleEquipmentError(error, res, next)
    }
  },
)

equipmentRouter.get(
  '/api/equipment/requests',
  requireAuth,
  requireFreshPassword,
  async (req, res, next) => {
    try {
      const membership = req.membership!
      const scopeRaw =
        typeof req.query.scope === 'string' ? req.query.scope : 'mine'
      const scope =
        scopeRaw === 'mine' || scopeRaw === 'all' ? scopeRaw : null
      if (!scope) {
        res.status(400).json({ ok: false, error: 'scope must be mine or all.' })
        return
      }
      const requests = await listEquipmentRequests({
        companyId: membership.companyId,
        isAdmin: membership.role === 'admin',
        actorEmployeeId: membership.employeeId,
        scope,
      })
      res.json({ ok: true, requests })
    } catch (error) {
      handleEquipmentError(error, res, next)
    }
  },
)

equipmentRouter.post(
  '/api/equipment/requests/:requestId/approve',
  requireAuth,
  requireFreshPassword,
  requireAdmin,
  async (req, res, next) => {
    try {
      const membership = req.membership!
      const requestId = Array.isArray(req.params.requestId)
        ? req.params.requestId[0]
        : req.params.requestId
      if (!requestId) {
        res.status(400).json({ ok: false, error: 'Invalid request id.' })
        return
      }
      const parsed = decideEquipmentRequestSchema.safeParse(req.body ?? {})
      if (!parsed.success) {
        res.status(400).json({
          ok: false,
          error: parsed.error.issues[0]?.message ?? 'Invalid decision.',
        })
        return
      }
      const request = await decideEquipmentRequest({
        companyId: membership.companyId,
        requestId,
        action: 'approve',
        isAdmin: true,
        actorEmployeeId: membership.employeeId,
        actorMembershipId: membership.membershipId,
        response: parsed.data.response,
      })
      res.json({ ok: true, request })
    } catch (error) {
      handleEquipmentError(error, res, next)
    }
  },
)

equipmentRouter.post(
  '/api/equipment/requests/:requestId/decline',
  requireAuth,
  requireFreshPassword,
  requireAdmin,
  async (req, res, next) => {
    try {
      const membership = req.membership!
      const requestId = Array.isArray(req.params.requestId)
        ? req.params.requestId[0]
        : req.params.requestId
      if (!requestId) {
        res.status(400).json({ ok: false, error: 'Invalid request id.' })
        return
      }
      const parsed = decideEquipmentRequestSchema.safeParse(req.body ?? {})
      if (!parsed.success) {
        res.status(400).json({
          ok: false,
          error: parsed.error.issues[0]?.message ?? 'Invalid decision.',
        })
        return
      }
      const request = await decideEquipmentRequest({
        companyId: membership.companyId,
        requestId,
        action: 'decline',
        isAdmin: true,
        actorEmployeeId: membership.employeeId,
        actorMembershipId: membership.membershipId,
        response: parsed.data.response,
      })
      res.json({ ok: true, request })
    } catch (error) {
      handleEquipmentError(error, res, next)
    }
  },
)

equipmentRouter.post(
  '/api/equipment/requests/:requestId/cancel',
  requireAuth,
  requireFreshPassword,
  async (req, res, next) => {
    try {
      const membership = req.membership!
      const requestId = Array.isArray(req.params.requestId)
        ? req.params.requestId[0]
        : req.params.requestId
      if (!requestId) {
        res.status(400).json({ ok: false, error: 'Invalid request id.' })
        return
      }
      const request = await decideEquipmentRequest({
        companyId: membership.companyId,
        requestId,
        action: 'cancel',
        isAdmin: membership.role === 'admin',
        actorEmployeeId: membership.employeeId,
        actorMembershipId: membership.membershipId,
      })
      res.json({ ok: true, request })
    } catch (error) {
      handleEquipmentError(error, res, next)
    }
  },
)

equipmentRouter.post(
  '/api/equipment/requests/:requestId/fulfil',
  requireAuth,
  requireFreshPassword,
  requireAdmin,
  async (req, res, next) => {
    try {
      const membership = req.membership!
      const requestId = Array.isArray(req.params.requestId)
        ? req.params.requestId[0]
        : req.params.requestId
      if (!requestId) {
        res.status(400).json({ ok: false, error: 'Invalid request id.' })
        return
      }
      const parsed = fulfilEquipmentRequestSchema.safeParse(req.body)
      if (!parsed.success) {
        res.status(400).json({
          ok: false,
          error: parsed.error.issues[0]?.message ?? 'Invalid fulfilment.',
        })
        return
      }
      const result = await fulfilEquipmentRequest({
        companyId: membership.companyId,
        requestId,
        issuedByMembershipId: membership.membershipId,
        ...parsed.data,
      })
      res.json({ ok: true, ...result })
    } catch (error) {
      handleEquipmentError(error, res, next)
    }
  },
)

equipmentRouter.post(
  '/api/equipment/assignments',
  requireAuth,
  requireFreshPassword,
  requireAdmin,
  async (req, res, next) => {
    try {
      const membership = req.membership!
      const parsed = assignEquipmentSchema.safeParse(req.body)
      if (!parsed.success) {
        res.status(400).json({
          ok: false,
          error: parsed.error.issues[0]?.message ?? 'Invalid assignment.',
        })
        return
      }
      const assignment = await assignEquipment({
        companyId: membership.companyId,
        issuedByMembershipId: membership.membershipId,
        ...parsed.data,
      })
      res.status(201).json({ ok: true, assignment })
    } catch (error) {
      handleEquipmentError(error, res, next)
    }
  },
)

equipmentRouter.get(
  '/api/equipment/assignments',
  requireAuth,
  requireFreshPassword,
  requireAdmin,
  async (req, res, next) => {
    try {
      const membership = req.membership!
      const activeOnly = req.query.activeOnly === 'true'
      const assignments = await listAllAssignments({
        companyId: membership.companyId,
        activeOnly,
      })
      res.json({ ok: true, assignments })
    } catch (error) {
      handleEquipmentError(error, res, next)
    }
  },
)

equipmentRouter.get(
  '/api/equipment/assignments/mine',
  requireAuth,
  requireFreshPassword,
  async (req, res, next) => {
    try {
      const membership = req.membership!
      if (!membership.employeeId) {
        res.json({ ok: true, assignments: [] })
        return
      }
      const assignments = await listAssignmentsForEmployee({
        companyId: membership.companyId,
        employeeId: String(membership.employeeId),
        isAdmin: membership.role === 'admin',
        actorEmployeeId: membership.employeeId,
        activeOnly: req.query.activeOnly === 'true',
      })
      res.json({ ok: true, assignments })
    } catch (error) {
      handleEquipmentError(error, res, next)
    }
  },
)

equipmentRouter.get(
  '/api/employees/:employeeId/equipment',
  requireAuth,
  requireFreshPassword,
  async (req, res, next) => {
    try {
      const membership = req.membership!
      const employeeId = Array.isArray(req.params.employeeId)
        ? req.params.employeeId[0]
        : req.params.employeeId
      if (!employeeId) {
        res.status(400).json({ ok: false, error: 'Invalid employee id.' })
        return
      }
      const assignments = await listAssignmentsForEmployee({
        companyId: membership.companyId,
        employeeId,
        isAdmin: membership.role === 'admin',
        actorEmployeeId: membership.employeeId,
        activeOnly: true,
      })
      res.json({ ok: true, assignments })
    } catch (error) {
      handleEquipmentError(error, res, next)
    }
  },
)

equipmentRouter.post(
  '/api/equipment/assignments/:assignmentId/return',
  requireAuth,
  requireFreshPassword,
  requireAdmin,
  async (req, res, next) => {
    try {
      const membership = req.membership!
      const assignmentId = Array.isArray(req.params.assignmentId)
        ? req.params.assignmentId[0]
        : req.params.assignmentId
      if (!assignmentId) {
        res.status(400).json({ ok: false, error: 'Invalid assignment id.' })
        return
      }
      const parsed = returnEquipmentSchema.safeParse(req.body)
      if (!parsed.success) {
        res.status(400).json({
          ok: false,
          error: parsed.error.issues[0]?.message ?? 'Invalid return.',
        })
        return
      }
      const assignment = await returnEquipment({
        companyId: membership.companyId,
        assignmentId,
        returnedByMembershipId: membership.membershipId,
        ...parsed.data,
      })
      res.json({ ok: true, assignment })
    } catch (error) {
      handleEquipmentError(error, res, next)
    }
  },
)
