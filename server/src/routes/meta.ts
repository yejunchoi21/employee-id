import { Router } from 'express'

/**
 * Documents what this foundation exposes vs what is still blocked.
 */
export const metaRouter = Router()

metaRouter.get('/api/meta/foundation', (_req, res) => {
  res.json({
    ready: {
      mongoModels: ['Company', 'Department', 'Membership', 'Employee'],
      departmentScopedQueries: true,
      approvedOnlyDirectoryFilter: true,
      authentication: true,
      companyMembershipFromSession: true,
      adminRoleGate: true,
    },
    blockedUntilEmployeeWorkflow: [
      'Populate signup department dropdown from company departments',
      'Create pending employee submissions',
      'Admin approval workflow',
      'SSE company fan-out after approval/department moves',
      'Company-scoped directory rack feed',
    ],
    note:
      'companyId is taken from the authenticated Membership session cookie, never from a form field.',
  })
})
