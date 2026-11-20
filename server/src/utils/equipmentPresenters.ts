import type { Types } from 'mongoose'
import type {
  EquipmentCategory,
  EquipmentItemStatus,
} from '../models/EquipmentItem.js'
import type { EquipmentRequestStatus } from '../models/EquipmentRequest.js'
import type { EquipmentReturnCondition } from '../models/EquipmentAssignment.js'

type ItemLean = {
  _id: Types.ObjectId
  companyId: Types.ObjectId
  assetTag: string
  name: string
  category: EquipmentCategory
  serialNumber?: string | null
  status: EquipmentItemStatus
  createdAt?: Date
  updatedAt?: Date
}

type RequestLean = {
  _id: Types.ObjectId
  companyId: Types.ObjectId
  requesterEmployeeId: Types.ObjectId
  category: EquipmentCategory
  reason: string
  status: EquipmentRequestStatus
  adminResponse?: string | null
  decidedAt?: Date | null
  decidedByMembershipId?: Types.ObjectId | null
  fulfilledAssignmentId?: Types.ObjectId | null
  createdAt?: Date
  updatedAt?: Date
}

type AssignmentLean = {
  _id: Types.ObjectId
  companyId: Types.ObjectId
  itemId: Types.ObjectId
  employeeId: Types.ObjectId
  requestId?: Types.ObjectId | null
  issuedAt: Date
  expectedReturnAt?: Date | null
  returnedAt?: Date | null
  returnCondition?: EquipmentReturnCondition | null
  returnNotes?: string | null
  issuedByMembershipId: Types.ObjectId
  returnedByMembershipId?: Types.ObjectId | null
  createdAt?: Date
  updatedAt?: Date
}

export function presentEquipmentItem(
  item: ItemLean,
  options: { includeSerial?: boolean } = {},
) {
  return {
    id: String(item._id),
    companyId: String(item.companyId),
    assetTag: item.assetTag,
    name: item.name,
    category: item.category,
    serialNumber: options.includeSerial
      ? item.serialNumber?.trim()
        ? item.serialNumber
        : null
      : undefined,
    status: item.status,
    createdAt: item.createdAt?.toISOString() ?? null,
    updatedAt: item.updatedAt?.toISOString() ?? null,
  }
}

export function presentEquipmentRequest(
  request: RequestLean,
  extras?: {
    requesterName?: string | null
    requesterEmail?: string | null
  },
) {
  return {
    id: String(request._id),
    companyId: String(request.companyId),
    requesterEmployeeId: String(request.requesterEmployeeId),
    category: request.category,
    reason: request.reason,
    status: request.status,
    adminResponse: request.adminResponse?.trim()
      ? request.adminResponse
      : null,
    decidedAt: request.decidedAt?.toISOString() ?? null,
    decidedByMembershipId: request.decidedByMembershipId
      ? String(request.decidedByMembershipId)
      : null,
    fulfilledAssignmentId: request.fulfilledAssignmentId
      ? String(request.fulfilledAssignmentId)
      : null,
    createdAt: request.createdAt?.toISOString() ?? null,
    updatedAt: request.updatedAt?.toISOString() ?? null,
    requesterName: extras?.requesterName ?? null,
    requesterEmail: extras?.requesterEmail ?? null,
  }
}

export function presentEquipmentAssignment(
  assignment: AssignmentLean,
  extras?: {
    item?: ReturnType<typeof presentEquipmentItem> | null
    employeeName?: string | null
    employeeEmail?: string | null
  },
) {
  return {
    id: String(assignment._id),
    companyId: String(assignment.companyId),
    itemId: String(assignment.itemId),
    employeeId: String(assignment.employeeId),
    requestId: assignment.requestId ? String(assignment.requestId) : null,
    issuedAt: assignment.issuedAt.toISOString(),
    expectedReturnAt: assignment.expectedReturnAt?.toISOString() ?? null,
    returnedAt: assignment.returnedAt?.toISOString() ?? null,
    returnCondition: assignment.returnCondition ?? null,
    returnNotes: assignment.returnNotes?.trim()
      ? assignment.returnNotes
      : null,
    issuedByMembershipId: String(assignment.issuedByMembershipId),
    returnedByMembershipId: assignment.returnedByMembershipId
      ? String(assignment.returnedByMembershipId)
      : null,
    createdAt: assignment.createdAt?.toISOString() ?? null,
    updatedAt: assignment.updatedAt?.toISOString() ?? null,
    active: !assignment.returnedAt,
    item: extras?.item ?? null,
    employeeName: extras?.employeeName ?? null,
    employeeEmail: extras?.employeeEmail ?? null,
  }
}
