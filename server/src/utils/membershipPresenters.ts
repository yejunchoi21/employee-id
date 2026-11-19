import type { Types } from 'mongoose'
import type { MembershipRole } from '../models/Membership.js'

type MembershipLean = {
  _id: Types.ObjectId
  companyId: Types.ObjectId
  email: string
  displayName: string
  role: MembershipRole
  employeeId?: Types.ObjectId | null
  mustChangePassword?: boolean | null
}

/**
 * Public membership shape. Never include passwordHash.
 */
export function presentMembership(membership: MembershipLean) {
  return {
    membershipId: String(membership._id),
    companyId: String(membership.companyId),
    email: membership.email,
    displayName: membership.displayName,
    role: membership.role,
    employeeId: membership.employeeId ? String(membership.employeeId) : null,
    mustChangePassword: Boolean(membership.mustChangePassword),
  }
}
