import { Router, type NextFunction, type Response } from 'express'
import { defaultOnboardingTasks } from '../constants/defaultOnboardingTasks.js'
import {
  requireAuth,
  requireFreshPassword,
  requireAdmin,
} from '../middleware/requireAuth.js'
import {
  addOnboardingTask,
  createOnboardingPlan,
  getOnboardingPlanForActor,
  listOnboardingPlansForActor,
  OnboardingError,
  setOnboardingTaskCompletion,
  updateOnboardingPlan,
  updateOnboardingTask,
} from '../services/onboardingPlans.js'
import {
  createOnboardingPlanSchema,
  updateOnboardingPlanSchema,
  upsertOnboardingTaskSchema,
} from '../validation/onboarding.js'

export const onboardingRouter = Router()

function handleOnboardingError(
  error: unknown,
  res: Response,
  next: NextFunction,
) {
  if (error instanceof OnboardingError) {
    res.status(error.status).json({ ok: false, error: error.message })
    return
  }
  next(error)
}

onboardingRouter.get(
  '/api/onboarding/defaults',
  requireAuth,
  requireFreshPassword,
  (_req, res) => {
    res.json({
      ok: true,
      tasks: defaultOnboardingTasks,
    })
  },
)

onboardingRouter.post(
  '/api/onboarding/plans',
  requireAuth,
  requireFreshPassword,
  requireAdmin,
  async (req, res, next) => {
    try {
      const membership = req.membership!
      const parsed = createOnboardingPlanSchema.safeParse(req.body)
      if (!parsed.success) {
        res.status(400).json({
          ok: false,
          error: parsed.error.issues[0]?.message ?? 'Invalid onboarding plan.',
        })
        return
      }

      const plan = await createOnboardingPlan({
        companyId: membership.companyId,
        createdByMembershipId: membership.membershipId,
        ...parsed.data,
      })

      res.status(201).json({ ok: true, plan })
    } catch (error) {
      handleOnboardingError(error, res, next)
    }
  },
)

onboardingRouter.get(
  '/api/onboarding/plans',
  requireAuth,
  requireFreshPassword,
  async (req, res, next) => {
    try {
      const membership = req.membership!
      const scopeRaw =
        typeof req.query.scope === 'string' ? req.query.scope : 'mine'
      const scope =
        scopeRaw === 'managed' || scopeRaw === 'all' || scopeRaw === 'mine'
          ? scopeRaw
          : null

      if (!scope) {
        res.status(400).json({
          ok: false,
          error: 'scope must be mine, managed, or all.',
        })
        return
      }

      const plans = await listOnboardingPlansForActor({
        companyId: membership.companyId,
        isAdmin: membership.role === 'admin',
        actorEmployeeId: membership.employeeId,
        scope,
      })

      res.json({ ok: true, plans })
    } catch (error) {
      handleOnboardingError(error, res, next)
    }
  },
)

onboardingRouter.get(
  '/api/onboarding/plans/:planId',
  requireAuth,
  requireFreshPassword,
  async (req, res, next) => {
    try {
      const membership = req.membership!
      const planId = Array.isArray(req.params.planId)
        ? req.params.planId[0]
        : req.params.planId

      if (!planId) {
        res.status(400).json({ ok: false, error: 'Invalid onboarding plan id.' })
        return
      }

      const result = await getOnboardingPlanForActor({
        companyId: membership.companyId,
        planId,
        isAdmin: membership.role === 'admin',
        actorEmployeeId: membership.employeeId,
      })

      res.json({ ok: true, role: result.role, plan: result.plan })
    } catch (error) {
      handleOnboardingError(error, res, next)
    }
  },
)

onboardingRouter.patch(
  '/api/onboarding/plans/:planId',
  requireAuth,
  requireFreshPassword,
  requireAdmin,
  async (req, res, next) => {
    try {
      const membership = req.membership!
      const planId = Array.isArray(req.params.planId)
        ? req.params.planId[0]
        : req.params.planId
      if (!planId) {
        res.status(400).json({ ok: false, error: 'Invalid onboarding plan id.' })
        return
      }

      const parsed = updateOnboardingPlanSchema.safeParse(req.body)
      if (!parsed.success) {
        res.status(400).json({
          ok: false,
          error: parsed.error.issues[0]?.message ?? 'Invalid plan update.',
        })
        return
      }

      const plan = await updateOnboardingPlan({
        companyId: membership.companyId,
        planId,
        isAdmin: true,
        actorEmployeeId: membership.employeeId,
        ...parsed.data,
      })

      res.json({ ok: true, plan })
    } catch (error) {
      handleOnboardingError(error, res, next)
    }
  },
)

onboardingRouter.post(
  '/api/onboarding/plans/:planId/tasks',
  requireAuth,
  requireFreshPassword,
  async (req, res, next) => {
    try {
      const membership = req.membership!
      const planId = Array.isArray(req.params.planId)
        ? req.params.planId[0]
        : req.params.planId
      if (!planId) {
        res.status(400).json({ ok: false, error: 'Invalid onboarding plan id.' })
        return
      }

      const parsed = upsertOnboardingTaskSchema.safeParse(req.body)
      if (!parsed.success) {
        res.status(400).json({
          ok: false,
          error: parsed.error.issues[0]?.message ?? 'Invalid task.',
        })
        return
      }

      const plan = await addOnboardingTask({
        companyId: membership.companyId,
        planId,
        isAdmin: membership.role === 'admin',
        actorEmployeeId: membership.employeeId,
        ...parsed.data,
      })

      res.status(201).json({ ok: true, plan })
    } catch (error) {
      handleOnboardingError(error, res, next)
    }
  },
)

onboardingRouter.patch(
  '/api/onboarding/plans/:planId/tasks/:taskId',
  requireAuth,
  requireFreshPassword,
  async (req, res, next) => {
    try {
      const membership = req.membership!
      const planId = Array.isArray(req.params.planId)
        ? req.params.planId[0]
        : req.params.planId
      const taskId = Array.isArray(req.params.taskId)
        ? req.params.taskId[0]
        : req.params.taskId

      if (!planId || !taskId) {
        res.status(400).json({ ok: false, error: 'Invalid plan or task id.' })
        return
      }

      const parsed = upsertOnboardingTaskSchema.safeParse(req.body)
      if (!parsed.success) {
        res.status(400).json({
          ok: false,
          error: parsed.error.issues[0]?.message ?? 'Invalid task update.',
        })
        return
      }

      const plan = await updateOnboardingTask({
        companyId: membership.companyId,
        planId,
        taskId,
        isAdmin: membership.role === 'admin',
        actorEmployeeId: membership.employeeId,
        ...parsed.data,
      })

      res.json({ ok: true, plan })
    } catch (error) {
      handleOnboardingError(error, res, next)
    }
  },
)

onboardingRouter.post(
  '/api/onboarding/plans/:planId/tasks/:taskId/complete',
  requireAuth,
  requireFreshPassword,
  async (req, res, next) => {
    try {
      const membership = req.membership!
      const planId = Array.isArray(req.params.planId)
        ? req.params.planId[0]
        : req.params.planId
      const taskId = Array.isArray(req.params.taskId)
        ? req.params.taskId[0]
        : req.params.taskId

      if (!planId || !taskId) {
        res.status(400).json({ ok: false, error: 'Invalid plan or task id.' })
        return
      }

      const plan = await setOnboardingTaskCompletion({
        companyId: membership.companyId,
        planId,
        taskId,
        isAdmin: membership.role === 'admin',
        actorEmployeeId: membership.employeeId,
        actorMembershipId: membership.membershipId,
        complete: true,
      })

      res.json({ ok: true, plan })
    } catch (error) {
      handleOnboardingError(error, res, next)
    }
  },
)

onboardingRouter.post(
  '/api/onboarding/plans/:planId/tasks/:taskId/reopen',
  requireAuth,
  requireFreshPassword,
  async (req, res, next) => {
    try {
      const membership = req.membership!
      const planId = Array.isArray(req.params.planId)
        ? req.params.planId[0]
        : req.params.planId
      const taskId = Array.isArray(req.params.taskId)
        ? req.params.taskId[0]
        : req.params.taskId

      if (!planId || !taskId) {
        res.status(400).json({ ok: false, error: 'Invalid plan or task id.' })
        return
      }

      const plan = await setOnboardingTaskCompletion({
        companyId: membership.companyId,
        planId,
        taskId,
        isAdmin: membership.role === 'admin',
        actorEmployeeId: membership.employeeId,
        actorMembershipId: membership.membershipId,
        complete: false,
      })

      res.json({ ok: true, plan })
    } catch (error) {
      handleOnboardingError(error, res, next)
    }
  },
)
