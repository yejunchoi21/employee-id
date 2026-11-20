import { apiRequest } from './client'

export type EquipmentCategory = 'laptop' | 'monitor' | 'headset' | 'other'
export type EquipmentItemStatus =
  | 'available'
  | 'assigned'
  | 'maintenance'
  | 'retired'
export type EquipmentRequestStatus =
  | 'pending'
  | 'approved'
  | 'declined'
  | 'cancelled'
  | 'fulfilled'
export type EquipmentReturnCondition =
  | 'good'
  | 'damaged'
  | 'needs_maintenance'

export interface EquipmentItemDto {
  id: string
  assetTag: string
  name: string
  category: EquipmentCategory
  serialNumber?: string | null
  status: EquipmentItemStatus
}

export interface EquipmentRequestDto {
  id: string
  requesterEmployeeId: string
  category: EquipmentCategory
  reason: string
  status: EquipmentRequestStatus
  adminResponse: string | null
  decidedAt: string | null
  createdAt: string | null
  requesterName: string | null
  requesterEmail: string | null
  fulfilledAssignmentId: string | null
}

export interface EquipmentAssignmentDto {
  id: string
  itemId: string
  employeeId: string
  requestId: string | null
  issuedAt: string
  expectedReturnAt: string | null
  returnedAt: string | null
  returnCondition: EquipmentReturnCondition | null
  returnNotes: string | null
  active: boolean
  item: EquipmentItemDto | null
  employeeName: string | null
  employeeEmail: string | null
}

export async function fetchMyEquipmentAssignments(activeOnly = false) {
  const query = activeOnly ? '?activeOnly=true' : ''
  return apiRequest<{ ok: true; assignments: EquipmentAssignmentDto[] }>(
    `/api/equipment/assignments/mine${query}`,
  )
}

export async function fetchEmployeeEquipment(employeeId: string) {
  return apiRequest<{ ok: true; assignments: EquipmentAssignmentDto[] }>(
    `/api/employees/${employeeId}/equipment`,
  )
}

export async function fetchEquipmentRequests(scope: 'mine' | 'all') {
  return apiRequest<{ ok: true; requests: EquipmentRequestDto[] }>(
    `/api/equipment/requests?scope=${scope}`,
  )
}

export async function createEquipmentRequest(input: {
  category: EquipmentCategory
  reason: string
}) {
  return apiRequest<{ ok: true; request: EquipmentRequestDto }>(
    '/api/equipment/requests',
    {
      method: 'POST',
      body: JSON.stringify(input),
    },
  )
}

export async function cancelEquipmentRequest(requestId: string) {
  return apiRequest<{ ok: true; request: EquipmentRequestDto }>(
    `/api/equipment/requests/${requestId}/cancel`,
    { method: 'POST' },
  )
}

export async function approveEquipmentRequest(
  requestId: string,
  response?: string,
) {
  return apiRequest<{ ok: true; request: EquipmentRequestDto }>(
    `/api/equipment/requests/${requestId}/approve`,
    {
      method: 'POST',
      body: JSON.stringify({ response }),
    },
  )
}

export async function declineEquipmentRequest(
  requestId: string,
  response?: string,
) {
  return apiRequest<{ ok: true; request: EquipmentRequestDto }>(
    `/api/equipment/requests/${requestId}/decline`,
    {
      method: 'POST',
      body: JSON.stringify({ response }),
    },
  )
}

export async function fulfilEquipmentRequest(
  requestId: string,
  input: {
    itemId: string
    issuedAt: string
    expectedReturnAt?: string | null
  },
) {
  return apiRequest<{
    ok: true
    request: EquipmentRequestDto
    assignment: EquipmentAssignmentDto
  }>(`/api/equipment/requests/${requestId}/fulfil`, {
    method: 'POST',
    body: JSON.stringify(input),
  })
}

export async function fetchInventoryItems(input: {
  search?: string
  status?: EquipmentItemStatus | 'all'
  category?: EquipmentCategory | 'all'
}) {
  const params = new URLSearchParams()
  if (input.search) params.set('search', input.search)
  params.set('status', input.status ?? 'all')
  params.set('category', input.category ?? 'all')
  return apiRequest<{ ok: true; items: EquipmentItemDto[] }>(
    `/api/equipment/items?${params.toString()}`,
  )
}

export async function createInventoryItem(input: {
  assetTag: string
  name: string
  category: EquipmentCategory
  serialNumber?: string | null
  status?: EquipmentItemStatus
}) {
  return apiRequest<{ ok: true; item: EquipmentItemDto }>(
    '/api/equipment/items',
    {
      method: 'POST',
      body: JSON.stringify(input),
    },
  )
}

export async function updateInventoryItem(
  itemId: string,
  input: Partial<{
    assetTag: string
    name: string
    category: EquipmentCategory
    serialNumber: string | null
    status: EquipmentItemStatus
  }>,
) {
  return apiRequest<{ ok: true; item: EquipmentItemDto }>(
    `/api/equipment/items/${itemId}`,
    {
      method: 'PATCH',
      body: JSON.stringify(input),
    },
  )
}

export async function assignEquipment(input: {
  itemId: string
  employeeId: string
  issuedAt: string
  expectedReturnAt?: string | null
  requestId?: string | null
}) {
  return apiRequest<{ ok: true; assignment: EquipmentAssignmentDto }>(
    '/api/equipment/assignments',
    {
      method: 'POST',
      body: JSON.stringify(input),
    },
  )
}

export async function fetchAllAssignments(activeOnly = false) {
  const query = activeOnly ? '?activeOnly=true' : ''
  return apiRequest<{ ok: true; assignments: EquipmentAssignmentDto[] }>(
    `/api/equipment/assignments${query}`,
  )
}

export async function returnEquipment(
  assignmentId: string,
  input: {
    returnedAt: string
    returnCondition: EquipmentReturnCondition
    nextItemStatus: 'available' | 'maintenance'
    returnNotes?: string | null
  },
) {
  return apiRequest<{ ok: true; assignment: EquipmentAssignmentDto }>(
    `/api/equipment/assignments/${assignmentId}/return`,
    {
      method: 'POST',
      body: JSON.stringify(input),
    },
  )
}

export async function deactivateEmployee(employeeId: string) {
  return apiRequest<{ ok: true; employee: { id: string; approvalStatus: string } }>(
    `/api/employees/${employeeId}/deactivate`,
    { method: 'POST' },
  )
}
