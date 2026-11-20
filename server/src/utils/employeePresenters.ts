import type { Types } from 'mongoose'

type EmployeeLean = {
  _id: Types.ObjectId
  companyId: Types.ObjectId
  departmentId: Types.ObjectId
  approvalStatus: 'pending' | 'approved' | 'rejected' | 'inactive'
  employeeCode: string
  name: string
  title: string
  initials: string
  office: string
  joined: string
  email: string
  phone: string
  manager: string
  bio: string
  skills: string[]
  portraitKey?: string | null
  submittedByMembershipId?: Types.ObjectId | null
  approvedByMembershipId?: Types.ObjectId | null
  approvedAt?: Date | null
  createdAt?: Date
  updatedAt?: Date
}

export function presentEmployee(employee: EmployeeLean) {
  return {
    id: String(employee._id),
    companyId: String(employee.companyId),
    departmentId: String(employee.departmentId),
    approvalStatus: employee.approvalStatus,
    employeeCode: employee.employeeCode,
    name: employee.name,
    title: employee.title,
    initials: employee.initials,
    office: employee.office,
    joined: employee.joined,
    email: employee.email,
    phone: employee.phone,
    manager: employee.manager,
    bio: employee.bio,
    skills: employee.skills,
    portraitKey: employee.portraitKey ?? null,
    submittedByMembershipId: employee.submittedByMembershipId
      ? String(employee.submittedByMembershipId)
      : null,
    approvedByMembershipId: employee.approvedByMembershipId
      ? String(employee.approvedByMembershipId)
      : null,
    approvedAt: employee.approvedAt?.toISOString() ?? null,
    createdAt: employee.createdAt?.toISOString() ?? null,
    updatedAt: employee.updatedAt?.toISOString() ?? null,
  }
}
