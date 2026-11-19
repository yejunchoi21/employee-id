import { Router, type NextFunction, type Request, type Response } from 'express'
import { Types } from 'mongoose'
import { requireAuth } from '../middleware/requireAuth.js'
import { Employee, HelpRequest, Membership } from '../models/index.js'
import {
  canAccessHelpRequest,
  planHelpRequestTransition,
  type HelpRequestAction,
} from '../services/helpRequestTransitions.js'
import { presentHelpRequest } from '../utils/helpRequestPresenters.js'
import {
  createHelpRequestSchema,
  helpRequestDecisionSchema,
  helpRequestListQuerySchema,
} from '../validation/helpRequest.js'

export const helpRequestsRouter = Router()

async function loadRecipientEmployee(
  companyId: Types.ObjectId,
  employeeId: string,
) {
  if (!Types.ObjectId.isValid(employeeId)) return null
  return Employee.findOne({
    _id: employeeId,
    companyId,
  }).lean()
}

async function assertCanAccessRequest(input: {
  membershipId: Types.ObjectId
  membershipEmail: string
  companyId: Types.ObjectId
  requestId: string
}) {
  if (!Types.ObjectId.isValid(input.requestId)) {
    return { ok: false as const, status: 400, error: 'Invalid request id.' }
  }

  const request = await HelpRequest.findOne({
    _id: input.requestId,
    companyId: input.companyId,
  }).lean()

  if (!request) {
    return { ok: false as const, status: 404, error: 'Help request not found.' }
  }

  const recipient = await Employee.findOne({
    _id: request.recipientEmployeeId,
    companyId: input.companyId,
  })
    .select({ email: 1, name: 1 })
    .lean()

  if (!recipient) {
    return { ok: false as const, status: 404, error: 'Help request not found.' }
  }

  const allowed = canAccessHelpRequest({
    membershipId: String(input.membershipId),
    membershipEmail: input.membershipEmail,
    senderMembershipId: String(request.senderMembershipId),
    recipientEmployeeEmail: recipient.email,
  })

  if (!allowed) {
    return {
      ok: false as const,
      status: 403,
      error: 'You do not have access to this help request.',
    }
  }

  return { ok: true as const, request, recipient }
}

async function enrichHelpRequest(request: {
  _id: Types.ObjectId
  companyId: Types.ObjectId
  senderMembershipId: Types.ObjectId
  recipientEmployeeId: Types.ObjectId
  subject: string
  question: string
  priority: 'low' | 'normal' | 'high'
  status: 'open' | 'accepted' | 'declined' | 'resolved' | 'cancelled'
  response?: string | null
  decidedAt?: Date | null
  resolvedAt?: Date | null
  cancelledAt?: Date | null
  createdAt?: Date
  updatedAt?: Date
}) {
  const [sender, recipient] = await Promise.all([
    Membership.findById(request.senderMembershipId)
      .select({ displayName: 1, email: 1 })
      .lean(),
    Employee.findById(request.recipientEmployeeId)
      .select({ name: 1, email: 1 })
      .lean(),
  ])

  return presentHelpRequest(request, {
    senderName: sender?.displayName,
    senderEmail: sender?.email,
    recipientName: recipient?.name,
    recipientEmail: recipient?.email,
  })
}

function actorForRequest(input: {
  membershipId: string
  membershipEmail: string
  senderMembershipId: string
  recipientEmployeeEmail: string
}): 'sender' | 'recipient' {
  if (input.membershipId === input.senderMembershipId) return 'sender'
  return 'recipient'
}

helpRequestsRouter.post(
  '/api/help-requests',
  requireAuth,
  async (req, res, next) => {
    try {
      const membership = req.membership!
      const parsed = createHelpRequestSchema.safeParse(req.body)
      if (!parsed.success) {
        res.status(400).json({
          ok: false,
          error: parsed.error.issues[0]?.message ?? 'Invalid help request.',
        })
        return
      }

      const recipient = await loadRecipientEmployee(
        membership.companyId,
        parsed.data.recipientEmployeeId,
      )

      if (!recipient) {
        res.status(404).json({
          ok: false,
          error: 'Recipient employee not found in your company.',
        })
        return
      }

      if (recipient.approvalStatus !== 'approved') {
        res.status(400).json({
          ok: false,
          error: 'Help requests can only be sent to active employees.',
        })
        return
      }

      if (
        recipient.email.trim().toLowerCase() ===
        membership.email.trim().toLowerCase()
      ) {
        res.status(400).json({
          ok: false,
          error: 'You cannot send a help request to yourself.',
        })
        return
      }

      const created = await HelpRequest.create({
        companyId: membership.companyId,
        senderMembershipId: membership.membershipId,
        recipientEmployeeId: recipient._id,
        subject: parsed.data.subject,
        question: parsed.data.question,
        priority: parsed.data.priority,
        status: 'open',
      })

      res.status(201).json({
        ok: true,
        request: await enrichHelpRequest(created.toObject()),
      })
    } catch (error) {
      next(error)
    }
  },
)

helpRequestsRouter.get(
  '/api/help-requests',
  requireAuth,
  async (req, res, next) => {
    try {
      const membership = req.membership!
      const parsed = helpRequestListQuerySchema.safeParse({
        box: typeof req.query.box === 'string' ? req.query.box : undefined,
        status:
          typeof req.query.status === 'string' ? req.query.status : undefined,
      })

      if (!parsed.success) {
        res.status(400).json({
          ok: false,
          error: parsed.error.issues[0]?.message ?? 'Invalid list query.',
        })
        return
      }

      const filter: Record<string, unknown> = {
        companyId: membership.companyId,
      }

      if (parsed.data.box === 'sent') {
        filter.senderMembershipId = membership.membershipId
      } else {
        const myEmployee = await Employee.findOne({
          companyId: membership.companyId,
          email: membership.email,
          approvalStatus: 'approved',
        })
          .select({ _id: 1 })
          .lean()

        if (!myEmployee) {
          res.json({ ok: true, requests: [] })
          return
        }

        filter.recipientEmployeeId = myEmployee._id
      }

      if (parsed.data.status !== 'all') {
        filter.status = parsed.data.status
      }

      const requests = await HelpRequest.find(filter)
        .sort({ createdAt: -1 })
        .lean()

      res.json({
        ok: true,
        requests: await Promise.all(requests.map((item) => enrichHelpRequest(item))),
      })
    } catch (error) {
      next(error)
    }
  },
)

helpRequestsRouter.get(
  '/api/help-requests/open-count',
  requireAuth,
  async (req, res, next) => {
    try {
      const membership = req.membership!
      const myEmployee = await Employee.findOne({
        companyId: membership.companyId,
        email: membership.email,
        approvalStatus: 'approved',
      })
        .select({ _id: 1 })
        .lean()

      if (!myEmployee) {
        res.json({ ok: true, openCount: 0 })
        return
      }

      const openCount = await HelpRequest.countDocuments({
        companyId: membership.companyId,
        recipientEmployeeId: myEmployee._id,
        status: 'open',
      })

      res.json({ ok: true, openCount })
    } catch (error) {
      next(error)
    }
  },
)

helpRequestsRouter.get(
  '/api/help-requests/:requestId',
  requireAuth,
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

      const access = await assertCanAccessRequest({
        membershipId: membership.membershipId,
        membershipEmail: membership.email,
        companyId: membership.companyId,
        requestId,
      })

      if (!access.ok) {
        res.status(access.status).json({ ok: false, error: access.error })
        return
      }

      res.json({
        ok: true,
        request: await enrichHelpRequest(access.request),
      })
    } catch (error) {
      next(error)
    }
  },
)

async function transitionHelpRequest(input: {
  req: Request
  res: Response
  next: NextFunction
  action: HelpRequestAction
  allowResponse: boolean
}) {
  try {
    const membership = input.req.membership!
    const requestId = Array.isArray(input.req.params.requestId)
      ? input.req.params.requestId[0]
      : input.req.params.requestId

    if (!requestId) {
      input.res.status(400).json({ ok: false, error: 'Invalid request id.' })
      return
    }

    let responseText: string | undefined
    if (input.allowResponse) {
      const parsed = helpRequestDecisionSchema.safeParse(input.req.body ?? {})
      if (!parsed.success) {
        input.res.status(400).json({
          ok: false,
          error: parsed.error.issues[0]?.message ?? 'Invalid response.',
        })
        return
      }
      responseText = parsed.data.response
    }

    const access = await assertCanAccessRequest({
      membershipId: membership.membershipId,
      membershipEmail: membership.email,
      companyId: membership.companyId,
      requestId,
    })

    if (!access.ok) {
      input.res.status(access.status).json({ ok: false, error: access.error })
      return
    }

    const actor = actorForRequest({
      membershipId: String(membership.membershipId),
      membershipEmail: membership.email,
      senderMembershipId: String(access.request.senderMembershipId),
      recipientEmployeeEmail: access.recipient.email,
    })

    const plan = planHelpRequestTransition({
      action: input.action,
      currentStatus: access.request.status,
      actor,
    })

    if (!plan.ok) {
      input.res.status(403).json({ ok: false, error: plan.error })
      return
    }

    const update: Record<string, unknown> = {
      status: plan.nextStatus,
      [plan.timestampField]: new Date(),
    }

    if (input.allowResponse && typeof responseText === 'string') {
      update.response = responseText
    }

    // Conditional update: only succeeds if status is still the expected value.
    // Prevents lost updates when accept/cancel race.
    const updated = await HelpRequest.findOneAndUpdate(
      {
        _id: access.request._id,
        companyId: membership.companyId,
        status: access.request.status,
      },
      { $set: update },
      { returnDocument: 'after' },
    ).lean()

    if (!updated) {
      input.res.status(409).json({
        ok: false,
        error:
          'This request was updated by someone else. Refresh and try again.',
      })
      return
    }

    input.res.json({
      ok: true,
      request: await enrichHelpRequest(updated),
    })
  } catch (error) {
    input.next(error)
  }
}

helpRequestsRouter.post(
  '/api/help-requests/:requestId/accept',
  requireAuth,
  (req, res, next) =>
    transitionHelpRequest({
      req,
      res,
      next,
      action: 'accept',
      allowResponse: true,
    }),
)

helpRequestsRouter.post(
  '/api/help-requests/:requestId/decline',
  requireAuth,
  (req, res, next) =>
    transitionHelpRequest({
      req,
      res,
      next,
      action: 'decline',
      allowResponse: true,
    }),
)

helpRequestsRouter.post(
  '/api/help-requests/:requestId/cancel',
  requireAuth,
  (req, res, next) =>
    transitionHelpRequest({
      req,
      res,
      next,
      action: 'cancel',
      allowResponse: false,
    }),
)

helpRequestsRouter.post(
  '/api/help-requests/:requestId/resolve',
  requireAuth,
  (req, res, next) =>
    transitionHelpRequest({
      req,
      res,
      next,
      action: 'resolve',
      allowResponse: false,
    }),
)
