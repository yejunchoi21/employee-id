import { Types } from 'mongoose'
import { Department, Employee } from '../models/index.js'

export class DepartmentMembershipError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'DepartmentMembershipError'
  }
}

/**
 * Ensures a department belongs to the authenticated company before
 * creating or moving an employee into it.
 */
export async function assertDepartmentInCompany(
  companyId: Types.ObjectId | string,
  departmentId: Types.ObjectId | string,
) {
  const department = await Department.findOne({
    _id: departmentId,
    companyId,
  }).lean()

  if (!department) {
    throw new DepartmentMembershipError(
      'Department does not belong to this company.',
    )
  }

  return department
}

/**
 * Directory queries must stay inside the caller's company and only
 * return approved employees. Pending cards stay out of the rack.
 */
export function approvedEmployeesQuery(input: {
  companyId: Types.ObjectId | string
  departmentId?: Types.ObjectId | string | 'all'
}) {
  const filter: Record<string, unknown> = {
    companyId: input.companyId,
    approvalStatus: 'approved',
  }

  if (input.departmentId && input.departmentId !== 'all') {
    filter.departmentId = input.departmentId
  }

  return Employee.find(filter)
}
