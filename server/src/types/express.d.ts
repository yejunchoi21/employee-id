import type { Types } from 'mongoose'
import type { MembershipRole } from '../models/Membership.js'

export interface AuthenticatedMembership {
  membershipId: Types.ObjectId
  companyId: Types.ObjectId
  email: string
  displayName: string
  role: MembershipRole
}

declare global {
  namespace Express {
    interface Request {
      membership?: AuthenticatedMembership
    }
  }
}

export {}
