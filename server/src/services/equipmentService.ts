import { Types } from 'mongoose'
import {
  Employee,
  EquipmentAssignment,
  EquipmentItem,
  EquipmentRequest,
} from '../models/index.js'
import {
  canAssignItem,
  canCancelEquipmentRequest,
  canViewEmployeeEquipment,
  planRequestDecision,
} from './equipmentAccess.js'
import {
  presentEquipmentAssignment,
  presentEquipmentItem,
  presentEquipmentRequest,
} from '../utils/equipmentPresenters.js'
import type {
  EquipmentCategory,
  EquipmentItemStatus,
} from '../models/EquipmentItem.js'
import type { EquipmentReturnCondition } from '../models/EquipmentAssignment.js'

export class EquipmentError extends Error {
  status: number

  constructor(message: string, status: number) {
    super(message)
    this.name = 'EquipmentError'
    this.status = status
  }
}

function parseDate(value: string, label: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    throw new EquipmentError(`Invalid ${label}.`, 400)
  }
  return date
}

async function requireApprovedEmployee(
  companyId: Types.ObjectId,
  employeeId: string,
) {
  if (!Types.ObjectId.isValid(employeeId)) {
    throw new EquipmentError('Invalid employee id.', 400)
  }
  const employee = await Employee.findOne({
    _id: employeeId,
    companyId,
    approvalStatus: 'approved',
  }).lean()
  if (!employee) {
    throw new EquipmentError(
      'Assignee must be an active employee in your company.',
      400,
    )
  }
  return employee
}

export async function countActiveAssignmentsForEmployee(
  companyId: Types.ObjectId,
  employeeId: Types.ObjectId,
) {
  return EquipmentAssignment.countDocuments({
    companyId,
    employeeId,
    returnedAt: null,
  })
}

export async function createInventoryItem(input: {
  companyId: Types.ObjectId
  assetTag: string
  name: string
  category: EquipmentCategory
  serialNumber?: string | null
  status?: EquipmentItemStatus
}) {
  const status = input.status ?? 'available'
  if (status === 'assigned') {
    throw new EquipmentError(
      'Create the item as available, then assign it separately.',
      400,
    )
  }

  try {
    const item = await EquipmentItem.create({
      companyId: input.companyId,
      assetTag: input.assetTag.trim().toUpperCase(),
      name: input.name.trim(),
      category: input.category,
      serialNumber: input.serialNumber?.trim() || undefined,
      status,
    })
    return presentEquipmentItem(item.toObject(), { includeSerial: true })
  } catch (error) {
    if (
      error &&
      typeof error === 'object' &&
      'code' in error &&
      (error as { code?: number }).code === 11000
    ) {
      throw new EquipmentError('Asset tag must be unique in your company.', 409)
    }
    throw error
  }
}

export async function updateInventoryItem(input: {
  companyId: Types.ObjectId
  itemId: string
  assetTag?: string
  name?: string
  category?: EquipmentCategory
  serialNumber?: string | null
  status?: EquipmentItemStatus
}) {
  if (!Types.ObjectId.isValid(input.itemId)) {
    throw new EquipmentError('Invalid item id.', 400)
  }

  const item = await EquipmentItem.findOne({
    _id: input.itemId,
    companyId: input.companyId,
  })
  if (!item) throw new EquipmentError('Equipment item not found.', 404)

  if (input.status === 'assigned' && item.status !== 'assigned') {
    throw new EquipmentError(
      'Use the assign endpoint to mark an item assigned.',
      400,
    )
  }

  if (item.status === 'assigned' && input.status && input.status !== 'assigned') {
    const active = await EquipmentAssignment.exists({
      companyId: input.companyId,
      itemId: item._id,
      returnedAt: null,
    })
    if (active) {
      throw new EquipmentError(
        'Return the active assignment before changing this item status.',
        409,
      )
    }
  }

  if (input.assetTag) item.assetTag = input.assetTag.trim().toUpperCase()
  if (input.name) item.name = input.name.trim()
  if (input.category) item.category = input.category
  if (input.serialNumber !== undefined) {
    item.serialNumber = input.serialNumber?.trim() || undefined
  }
  if (input.status) item.status = input.status

  try {
    await item.save()
  } catch (error) {
    if (
      error &&
      typeof error === 'object' &&
      'code' in error &&
      (error as { code?: number }).code === 11000
    ) {
      throw new EquipmentError('Asset tag must be unique in your company.', 409)
    }
    throw error
  }

  return presentEquipmentItem(item.toObject(), { includeSerial: true })
}

export async function listInventoryItems(input: {
  companyId: Types.ObjectId
  search?: string
  status?: EquipmentItemStatus | 'all'
  category?: EquipmentCategory | 'all'
}) {
  const filter: Record<string, unknown> = { companyId: input.companyId }
  if (input.status && input.status !== 'all') filter.status = input.status
  if (input.category && input.category !== 'all') {
    filter.category = input.category
  }
  if (input.search?.trim()) {
    const q = input.search.trim()
    filter.$or = [
      { assetTag: { $regex: q, $options: 'i' } },
      { name: { $regex: q, $options: 'i' } },
      { serialNumber: { $regex: q, $options: 'i' } },
    ]
  }

  const items = await EquipmentItem.find(filter).sort({ assetTag: 1 }).lean()
  return items.map((item) =>
    presentEquipmentItem(item, { includeSerial: true }),
  )
}

export async function createEquipmentRequest(input: {
  companyId: Types.ObjectId
  requesterEmployeeId: Types.ObjectId
  category: EquipmentCategory
  reason: string
}) {
  const request = await EquipmentRequest.create({
    companyId: input.companyId,
    requesterEmployeeId: input.requesterEmployeeId,
    category: input.category,
    reason: input.reason.trim(),
    status: 'pending',
  })
  return presentEquipmentRequest(request.toObject())
}

export async function listEquipmentRequests(input: {
  companyId: Types.ObjectId
  isAdmin: boolean
  actorEmployeeId: Types.ObjectId | null
  scope: 'mine' | 'all'
}) {
  if (input.scope === 'all' && !input.isAdmin) {
    throw new EquipmentError('Admin role required.', 403)
  }
  if (input.scope === 'mine' && !input.actorEmployeeId) {
    return []
  }

  const filter: Record<string, unknown> = { companyId: input.companyId }
  if (input.scope === 'mine') {
    filter.requesterEmployeeId = input.actorEmployeeId
  }

  const requests = await EquipmentRequest.find(filter)
    .sort({ createdAt: -1 })
    .lean()

  const employeeIds = [
    ...new Set(requests.map((request) => String(request.requesterEmployeeId))),
  ]
  const employees = await Employee.find({
    _id: { $in: employeeIds },
  })
    .select({ name: 1, email: 1 })
    .lean()
  const byId = new Map(
    employees.map((employee) => [String(employee._id), employee]),
  )

  return requests.map((request) => {
    const requester = byId.get(String(request.requesterEmployeeId))
    return presentEquipmentRequest(request, {
      requesterName: requester?.name,
      requesterEmail: requester?.email,
    })
  })
}

export async function decideEquipmentRequest(input: {
  companyId: Types.ObjectId
  requestId: string
  action: 'approve' | 'decline' | 'cancel'
  isAdmin: boolean
  actorEmployeeId: Types.ObjectId | null
  actorMembershipId: Types.ObjectId
  response?: string | null
}) {
  if (!Types.ObjectId.isValid(input.requestId)) {
    throw new EquipmentError('Invalid request id.', 400)
  }

  const request = await EquipmentRequest.findOne({
    _id: input.requestId,
    companyId: input.companyId,
  })
  if (!request) throw new EquipmentError('Equipment request not found.', 404)

  const actor =
    input.isAdmin
      ? 'admin'
      : input.actorEmployeeId &&
          String(input.actorEmployeeId) === String(request.requesterEmployeeId)
        ? 'requester'
        : 'other'

  if (input.action === 'cancel') {
    if (
      !canCancelEquipmentRequest({
        isAdmin: input.isAdmin,
        actorEmployeeId: input.actorEmployeeId
          ? String(input.actorEmployeeId)
          : null,
        requesterEmployeeId: String(request.requesterEmployeeId),
        status: request.status,
      })
    ) {
      throw new EquipmentError(
        'Only the requester can cancel a pending request.',
        403,
      )
    }
  }

  const plan = planRequestDecision({
    action: input.action,
    status: request.status,
    actor,
  })
  if (!plan.ok) throw new EquipmentError(plan.error, 403)

  const updated = await EquipmentRequest.findOneAndUpdate(
    {
      _id: request._id,
      companyId: input.companyId,
      status: request.status,
    },
    {
      $set: {
        status: plan.nextStatus,
        adminResponse: input.response?.trim() || undefined,
        decidedAt: new Date(),
        decidedByMembershipId: input.actorMembershipId,
      },
    },
    { returnDocument: 'after' },
  ).lean()

  if (!updated) {
    throw new EquipmentError(
      'This request was updated by someone else. Refresh and try again.',
      409,
    )
  }

  return presentEquipmentRequest(updated)
}

async function createAssignmentAtomic(input: {
  companyId: Types.ObjectId
  itemId: string
  employeeId: string
  requestId?: string | null
  issuedAt: string
  expectedReturnAt?: string | null
  issuedByMembershipId: Types.ObjectId
}) {
  const employee = await requireApprovedEmployee(
    input.companyId,
    input.employeeId,
  )
  if (!Types.ObjectId.isValid(input.itemId)) {
    throw new EquipmentError('Invalid item id.', 400)
  }

  const issuedAt = parseDate(input.issuedAt, 'issue date')
  const expectedReturnAt = input.expectedReturnAt
    ? parseDate(input.expectedReturnAt, 'expected return date')
    : undefined

  // Claim the item only if it is still available.
  const claimed = await EquipmentItem.findOneAndUpdate(
    {
      _id: input.itemId,
      companyId: input.companyId,
      status: 'available',
    },
    { $set: { status: 'assigned' } },
    { returnDocument: 'after' },
  )

  if (!claimed) {
    const existing = await EquipmentItem.findOne({
      _id: input.itemId,
      companyId: input.companyId,
    }).lean()
    if (!existing) throw new EquipmentError('Equipment item not found.', 404)
    if (!canAssignItem(existing.status)) {
      throw new EquipmentError(
        'Only available items can be assigned.',
        409,
      )
    }
    throw new EquipmentError(
      'This item was just assigned by someone else. Refresh and try again.',
      409,
    )
  }

  try {
    const assignment = await EquipmentAssignment.create({
      companyId: input.companyId,
      itemId: claimed._id,
      employeeId: employee._id,
      requestId: input.requestId
        ? new Types.ObjectId(input.requestId)
        : undefined,
      issuedAt,
      expectedReturnAt,
      issuedByMembershipId: input.issuedByMembershipId,
    })

    return {
      assignment,
      item: claimed,
      employee,
    }
  } catch (error) {
    // Roll item back if unique active-assignment index blocks the write.
    await EquipmentItem.findOneAndUpdate(
      { _id: claimed._id, status: 'assigned' },
      { $set: { status: 'available' } },
    )
    if (
      error &&
      typeof error === 'object' &&
      'code' in error &&
      (error as { code?: number }).code === 11000
    ) {
      throw new EquipmentError(
        'This item already has an active assignment.',
        409,
      )
    }
    throw error
  }
}

export async function assignEquipment(input: {
  companyId: Types.ObjectId
  itemId: string
  employeeId: string
  requestId?: string | null
  issuedAt: string
  expectedReturnAt?: string | null
  issuedByMembershipId: Types.ObjectId
}) {
  const created = await createAssignmentAtomic(input)
  return presentEquipmentAssignment(created.assignment.toObject(), {
    item: presentEquipmentItem(created.item.toObject(), {
      includeSerial: true,
    }),
    employeeName: created.employee.name,
    employeeEmail: created.employee.email,
  })
}

export async function fulfilEquipmentRequest(input: {
  companyId: Types.ObjectId
  requestId: string
  itemId: string
  issuedAt: string
  expectedReturnAt?: string | null
  issuedByMembershipId: Types.ObjectId
}) {
  if (!Types.ObjectId.isValid(input.requestId)) {
    throw new EquipmentError('Invalid request id.', 400)
  }

  const request = await EquipmentRequest.findOne({
    _id: input.requestId,
    companyId: input.companyId,
  })
  if (!request) throw new EquipmentError('Equipment request not found.', 404)
  if (request.status !== 'approved') {
    throw new EquipmentError(
      'Only approved requests can be fulfilled with an assignment.',
      409,
    )
  }

  const created = await createAssignmentAtomic({
    companyId: input.companyId,
    itemId: input.itemId,
    employeeId: String(request.requesterEmployeeId),
    requestId: String(request._id),
    issuedAt: input.issuedAt,
    expectedReturnAt: input.expectedReturnAt,
    issuedByMembershipId: input.issuedByMembershipId,
  })

  const updatedRequest = await EquipmentRequest.findOneAndUpdate(
    {
      _id: request._id,
      companyId: input.companyId,
      status: 'approved',
    },
    {
      $set: {
        status: 'fulfilled',
        fulfilledAssignmentId: created.assignment._id,
      },
    },
    { returnDocument: 'after' },
  ).lean()

  if (!updatedRequest) {
    // Rare race: another admin fulfilled first. Keep assignment but surface conflict.
    throw new EquipmentError(
      'This request was fulfilled by someone else. Refresh and review assignments.',
      409,
    )
  }

  return {
    request: presentEquipmentRequest(updatedRequest),
    assignment: presentEquipmentAssignment(created.assignment.toObject(), {
      item: presentEquipmentItem(created.item.toObject(), {
        includeSerial: true,
      }),
      employeeName: created.employee.name,
      employeeEmail: created.employee.email,
    }),
  }
}

export async function returnEquipment(input: {
  companyId: Types.ObjectId
  assignmentId: string
  returnedAt: string
  returnCondition: EquipmentReturnCondition
  nextItemStatus: 'available' | 'maintenance'
  returnNotes?: string | null
  returnedByMembershipId: Types.ObjectId
}) {
  if (!Types.ObjectId.isValid(input.assignmentId)) {
    throw new EquipmentError('Invalid assignment id.', 400)
  }

  const assignment = await EquipmentAssignment.findOne({
    _id: input.assignmentId,
    companyId: input.companyId,
    returnedAt: null,
  })
  if (!assignment) {
    throw new EquipmentError('Active assignment not found.', 404)
  }

  const returnedAt = parseDate(input.returnedAt, 'return date')
  assignment.returnedAt = returnedAt
  assignment.returnCondition = input.returnCondition
  assignment.returnNotes = input.returnNotes?.trim() || undefined
  assignment.returnedByMembershipId = input.returnedByMembershipId
  await assignment.save()

  const item = await EquipmentItem.findOneAndUpdate(
    {
      _id: assignment.itemId,
      companyId: input.companyId,
      status: 'assigned',
    },
    { $set: { status: input.nextItemStatus } },
    { returnDocument: 'after' },
  )

  const employee = await Employee.findById(assignment.employeeId)
    .select({ name: 1, email: 1 })
    .lean()

  return presentEquipmentAssignment(assignment.toObject(), {
    item: item
      ? presentEquipmentItem(item.toObject(), { includeSerial: true })
      : null,
    employeeName: employee?.name,
    employeeEmail: employee?.email,
  })
}

export async function listAssignmentsForEmployee(input: {
  companyId: Types.ObjectId
  employeeId: string
  isAdmin: boolean
  actorEmployeeId: Types.ObjectId | null
  activeOnly?: boolean
}) {
  if (
    !canViewEmployeeEquipment({
      isAdmin: input.isAdmin,
      actorEmployeeId: input.actorEmployeeId
        ? String(input.actorEmployeeId)
        : null,
      targetEmployeeId: input.employeeId,
    })
  ) {
    throw new EquipmentError(
      'You do not have access to this employee’s equipment.',
      403,
    )
  }

  if (!Types.ObjectId.isValid(input.employeeId)) {
    throw new EquipmentError('Invalid employee id.', 400)
  }

  const filter: Record<string, unknown> = {
    companyId: input.companyId,
    employeeId: input.employeeId,
  }
  if (input.activeOnly) filter.returnedAt = null

  const assignments = await EquipmentAssignment.find(filter)
    .sort({ issuedAt: -1 })
    .lean()

  const itemIds = assignments.map((assignment) => assignment.itemId)
  const items = await EquipmentItem.find({ _id: { $in: itemIds } }).lean()
  const itemById = new Map(items.map((item) => [String(item._id), item]))

  return assignments.map((assignment) => {
    const item = itemById.get(String(assignment.itemId))
    return presentEquipmentAssignment(assignment, {
      item: item
        ? presentEquipmentItem(item, { includeSerial: true })
        : null,
    })
  })
}

export async function listAllAssignments(input: {
  companyId: Types.ObjectId
  activeOnly?: boolean
}) {
  const filter: Record<string, unknown> = { companyId: input.companyId }
  if (input.activeOnly) filter.returnedAt = null

  const assignments = await EquipmentAssignment.find(filter)
    .sort({ issuedAt: -1 })
    .lean()

  const itemIds = assignments.map((assignment) => assignment.itemId)
  const employeeIds = assignments.map((assignment) => assignment.employeeId)
  const [items, employees] = await Promise.all([
    EquipmentItem.find({ _id: { $in: itemIds } }).lean(),
    Employee.find({ _id: { $in: employeeIds } })
      .select({ name: 1, email: 1 })
      .lean(),
  ])
  const itemById = new Map(items.map((item) => [String(item._id), item]))
  const employeeById = new Map(
    employees.map((employee) => [String(employee._id), employee]),
  )

  return assignments.map((assignment) => {
    const item = itemById.get(String(assignment.itemId))
    const employee = employeeById.get(String(assignment.employeeId))
    return presentEquipmentAssignment(assignment, {
      item: item
        ? presentEquipmentItem(item, { includeSerial: true })
        : null,
      employeeName: employee?.name,
      employeeEmail: employee?.email,
    })
  })
}
