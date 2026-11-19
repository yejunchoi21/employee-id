import { Router } from 'express'

/**
 * Documents what this foundation exposes vs what is still blocked.
 */
export const metaRouter = Router()

metaRouter.get('/api/meta/foundation', (_req, res) => {
  res.json({
    ready: {
      mongoModels: ['Company', 'Department', 'Membership', 'Employee'],
      defaultDepartments: [
        'Engineering',
        'Business',
        'Design',
        'Marketing',
        'Human Resources',
      ],
      departmentListFromDatabase: true,
      authentication: true,
      companyMembershipFromSession: true,
      pendingEmployeeSubmissions: true,
      adminApprovalDecisions: true,
      approvedOnlyPublishedList: true,
    },
    blockedUntilNextMilestone: [
      'Frontend department dropdown wired to /api/departments',
      'SSE company fan-out after approval/department moves',
      'Company-scoped rotating rack feed',
    ],
    note:
      'companyId is taken from the authenticated Membership session cookie, never from a form field.',
  })
})
