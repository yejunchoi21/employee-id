import { randomUUID } from 'node:crypto'
import { Types } from 'mongoose'
import { hashPassword } from '../auth/password.js'
import { Employee, Membership } from '../models/index.js'
import {
  assertDepartmentInCompany,
  DepartmentMembershipError,
} from './departmentMembership.js'
import { nextEmployeeCode } from '../utils/employeeCode.js'
import { initialsFromName } from '../utils/initials.js'
import { presentMembership } from '../utils/membershipPresenters.js'
import { presentEmployee } from '../utils/employeePresenters.js'

export class EmployeeAccountError extends Error {
  status: number

  constructor(message: string, status: number) {
    super(message)
    this.name = 'EmployeeAccountError'
    this.status = status
  }
}

export interface CreateEmployeeAccountInput {
  companyId: Types.ObjectId
  createdByMembershipId: Types.ObjectId
  email: string
  displayName: string
  initialPassword: string
  departmentId: string
  title: string
  office: string
  joined: string
  phone: string
  manager: string
  bio: string
  skills: string[]
}

/**
 * Creates a member-role account linked to an approved employee profile.
 * Never returns or logs password hashes.
 */
export async function createEmployeeAccount(
  input: CreateEmployeeAccountInput,
) {
  if (!Types.ObjectId.isValid(input.departmentId)) {
    throw new EmployeeAccountError('Invalid departmentId.', 400)
  }

  try {
    await assertDepartmentInCompany(input.companyId, input.departmentId)
  } catch (error) {
    if (error instanceof DepartmentMembershipError) {
      throw new EmployeeAccountError(error.message, 400)
    }
    throw error
  }

  const email = input.email.trim().toLowerCase()

  const existingMembership = await Membership.findOne({
    companyId: input.companyId,
    email,
  }).lean()

  if (existingMembership) {
    throw new EmployeeAccountError(
      'An account already exists for this email.',
      409,
    )
  }

  const existingEmployee = await Employee.findOne({
    companyId: input.companyId,
    email,
  })

  if (existingEmployee?.approvalStatus === 'pending') {
    throw new EmployeeAccountError(
      'A pending employee card already uses this email. Approve or reject it first.',
      409,
    )
  }

  const passwordHash = await hashPassword(input.initialPassword)
  const membership = await Membership.create({
    companyId: input.companyId,
    email,
    displayName: input.displayName.trim(),
    role: 'member',
    mustChangePassword: true,
    authUserId: `member-${randomUUID()}`,
    passwordHash,
  })

  let employee = existingEmployee

  if (employee) {
    // Preserve existing directory profile fields; only ensure it is active
    // and linked to the new account.
    if (employee.approvalStatus !== 'approved') {
      employee.approvalStatus = 'approved'
      employee.approvedByMembershipId = input.createdByMembershipId
      employee.approvedAt = new Date()
    }
    if (!employee.submittedByMembershipId) {
      employee.submittedByMembershipId = membership._id
    }
    await employee.save()
  } else {
    employee = await Employee.create({
      companyId: input.companyId,
      departmentId: new Types.ObjectId(input.departmentId),
      approvalStatus: 'approved',
      employeeCode: await nextEmployeeCode(input.companyId),
      name: input.displayName.trim(),
      title: input.title.trim(),
      initials: initialsFromName(input.displayName),
      office: input.office.trim(),
      joined: input.joined.trim(),
      email,
      phone: input.phone.trim(),
      manager: input.manager.trim(),
      bio: input.bio.trim(),
      skills: input.skills,
      submittedByMembershipId: membership._id,
      approvedByMembershipId: input.createdByMembershipId,
      approvedAt: new Date(),
    })
  }

  membership.employeeId = employee._id
  await membership.save()

  const membershipObject = membership.toObject()
  // Extra safety: never leak hash even if select:false is bypassed via toObject.
  delete (membershipObject as { passwordHash?: string }).passwordHash

  return {
    membership: presentMembership(membershipObject),
    employee: presentEmployee(employee.toObject()),
    linkedExistingProfile: Boolean(existingEmployee),
  }
}
