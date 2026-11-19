import { Router } from 'express'
import { Types } from 'mongoose'
import {
  requireAdmin,
  requireAuth,
  requireFreshPassword,
} from '../middleware/requireAuth.js'
import { Employee } from '../models/index.js'
import {
  assertDepartmentInCompany,
  DepartmentMembershipError,
} from '../services/departmentMembership.js'
import { nextEmployeeCode } from '../utils/employeeCode.js'
import { presentEmployee } from '../utils/employeePresenters.js'
import { initialsFromName } from '../utils/initials.js'
import {
  approvalDecisionSchema,
  employeeSubmissionSchema,
} from '../validation/employeeSubmission.js'

export const employeesRouter = Router()

employeesRouter.post(
  '/api/employees/submissions',
  requireAuth,
  requireFreshPassword,
  async (req, res, next) => {
    try {
      const membership = req.membership!
      const parsed = employeeSubmissionSchema.safeParse(req.body)
      if (!parsed.success) {
        res.status(400).json({
          ok: false,
          error: parsed.error.issues[0]?.message ?? 'Invalid submission.',
        })
        return
      }

      if (!Types.ObjectId.isValid(parsed.data.departmentId)) {
        res.status(400).json({ ok: false, error: 'Invalid departmentId.' })
        return
      }

      try {
        await assertDepartmentInCompany(
          membership.companyId,
          parsed.data.departmentId,
        )
      } catch (error) {
        if (error instanceof DepartmentMembershipError) {
          res.status(400).json({ ok: false, error: error.message })
          return
        }
        throw error
      }

      const email = membership.email
      const existing = await Employee.findOne({
        companyId: membership.companyId,
        email,
      })

      if (existing && existing.approvalStatus === 'approved') {
        res.status(409).json({
          ok: false,
          error: 'An approved employee card already exists for your account.',
        })
        return
      }

      if (existing && existing.approvalStatus === 'pending') {
        res.status(409).json({
          ok: false,
          error: 'You already have a pending employee card submission.',
        })
        return
      }

      let employee
      if (existing && existing.approvalStatus === 'rejected') {
        existing.departmentId = new Types.ObjectId(parsed.data.departmentId)
        existing.approvalStatus = 'pending'
        existing.name = parsed.data.name
        existing.title = parsed.data.title
        existing.initials = initialsFromName(parsed.data.name)
        existing.office = parsed.data.office
        existing.joined = parsed.data.joined
        existing.phone = parsed.data.phone
        existing.manager = parsed.data.manager
        existing.bio = parsed.data.bio
        existing.skills = parsed.data.skills
        existing.submittedByMembershipId = membership.membershipId
        existing.approvedByMembershipId = undefined
        existing.approvedAt = undefined
        employee = await existing.save()
      } else {
        employee = await Employee.create({
          companyId: membership.companyId,
          departmentId: new Types.ObjectId(parsed.data.departmentId),
          approvalStatus: 'pending',
          employeeCode: await nextEmployeeCode(membership.companyId),
          name: parsed.data.name,
          title: parsed.data.title,
          initials: initialsFromName(parsed.data.name),
          office: parsed.data.office,
          joined: parsed.data.joined,
          email,
          phone: parsed.data.phone,
          manager: parsed.data.manager,
          bio: parsed.data.bio,
          skills: parsed.data.skills,
          submittedByMembershipId: membership.membershipId,
        })
      }

      res.status(201).json({
        ok: true,
        employee: presentEmployee(employee.toObject()),
      })
    } catch (error) {
      next(error)
    }
  },
)

employeesRouter.get(
  '/api/employees/submissions/mine',
  requireAuth,
  requireFreshPassword,
  async (req, res, next) => {
    try {
      const membership = req.membership!
      const employee = await Employee.findOne({
        companyId: membership.companyId,
        submittedByMembershipId: membership.membershipId,
      })
        .sort({ updatedAt: -1 })
        .lean()

      res.json({
        ok: true,
        employee: employee ? presentEmployee(employee) : null,
      })
    } catch (error) {
      next(error)
    }
  },
)

employeesRouter.get(
  '/api/employees/pending',
  requireAuth,
  requireFreshPassword,
  requireAdmin,
  async (req, res, next) => {
    try {
      const membership = req.membership!
      const pending = await Employee.find({
        companyId: membership.companyId,
        approvalStatus: 'pending',
      })
        .sort({ createdAt: 1 })
        .lean()

      res.json({
        ok: true,
        employees: pending.map(presentEmployee),
      })
    } catch (error) {
      next(error)
    }
  },
)

employeesRouter.post(
  '/api/employees/:employeeId/decision',
  requireAuth,
  requireFreshPassword,
  requireAdmin,
  async (req, res, next) => {
    try {
      const membership = req.membership!
      const employeeId = Array.isArray(req.params.employeeId)
        ? req.params.employeeId[0]
        : req.params.employeeId

      if (!employeeId || !Types.ObjectId.isValid(employeeId)) {
        res.status(400).json({ ok: false, error: 'Invalid employeeId.' })
        return
      }

      const parsed = approvalDecisionSchema.safeParse(req.body)
      if (!parsed.success) {
        res.status(400).json({
          ok: false,
          error: 'Decision must be approve or reject.',
        })
        return
      }

      const employee = await Employee.findOne({
        _id: employeeId,
        companyId: membership.companyId,
      })

      if (!employee) {
        res.status(404).json({
          ok: false,
          error: 'Employee submission not found in your company.',
        })
        return
      }

      if (employee.approvalStatus !== 'pending') {
        res.status(409).json({
          ok: false,
          error: `Submission is already ${employee.approvalStatus}.`,
        })
        return
      }

      // Re-validate department still belongs to the company at decision time.
      try {
        await assertDepartmentInCompany(
          membership.companyId,
          employee.departmentId,
        )
      } catch (error) {
        if (error instanceof DepartmentMembershipError) {
          res.status(400).json({ ok: false, error: error.message })
          return
        }
        throw error
      }

      if (parsed.data.decision === 'approve') {
        employee.approvalStatus = 'approved'
        employee.approvedByMembershipId = membership.membershipId
        employee.approvedAt = new Date()
      } else {
        employee.approvalStatus = 'rejected'
        employee.approvedByMembershipId = undefined
        employee.approvedAt = undefined
      }

      await employee.save()

      res.json({
        ok: true,
        employee: presentEmployee(employee.toObject()),
      })
    } catch (error) {
      next(error)
    }
  },
)

/**
 * Safety check helper for later directory work: only approved cards.
 * Not a rack feed — just confirms pending/rejected stay out.
 */
employeesRouter.get(
  '/api/employees/published',
  requireAuth,
  requireFreshPassword,
  async (req, res, next) => {
    try {
      const membership = req.membership!
      const employees = await Employee.find({
        companyId: membership.companyId,
        approvalStatus: 'approved',
      })
        .sort({ name: 1 })
        .lean()

      res.json({
        ok: true,
        employees: employees.map(presentEmployee),
      })
    } catch (error) {
      next(error)
    }
  },
)
