import { apiRequest } from './client'

export type HelpRequestPriority = 'low' | 'normal' | 'high'
export type HelpRequestStatus =
  | 'open'
  | 'accepted'
  | 'declined'
  | 'resolved'
  | 'cancelled'

export interface HelpRequestDto {
  id: string
  companyId: string
  senderMembershipId: string
  recipientEmployeeId: string
  subject: string
  question: string
  priority: HelpRequestPriority
  status: HelpRequestStatus
  response: string | null
  decidedAt: string | null
  resolvedAt: string | null
  cancelledAt: string | null
  createdAt: string | null
  updatedAt: string | null
  senderName: string | null
  senderEmail: string | null
  recipientName: string | null
  recipientEmail: string | null
}

export interface PublishedEmployeeDto {
  id: string
  departmentId: string
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
  approvalStatus: 'pending' | 'approved' | 'rejected'
}

export async function fetchPublishedEmployees() {
  return apiRequest<{ ok: true; employees: PublishedEmployeeDto[] }>(
    '/api/employees/published',
  )
}

export async function fetchDepartments() {
  return apiRequest<{
    ok: true
    departments: Array<{ id: string; name: string; companyId: string }>
  }>('/api/departments')
}

export async function fetchOpenHelpRequestCount() {
  return apiRequest<{ ok: true; openCount: number }>(
    '/api/help-requests/open-count',
  )
}

export async function fetchHelpRequests(input: {
  box: 'sent' | 'received'
  status?: HelpRequestStatus | 'all'
}) {
  const params = new URLSearchParams({
    box: input.box,
    status: input.status ?? 'all',
  })
  return apiRequest<{ ok: true; requests: HelpRequestDto[] }>(
    `/api/help-requests?${params.toString()}`,
  )
}

export async function fetchHelpRequest(requestId: string) {
  return apiRequest<{ ok: true; request: HelpRequestDto }>(
    `/api/help-requests/${requestId}`,
  )
}

export async function createHelpRequest(input: {
  recipientEmployeeId: string
  subject: string
  question: string
  priority: HelpRequestPriority
}) {
  return apiRequest<{ ok: true; request: HelpRequestDto }>('/api/help-requests', {
    method: 'POST',
    body: JSON.stringify(input),
  })
}

export async function acceptHelpRequest(
  requestId: string,
  response?: string,
) {
  return apiRequest<{ ok: true; request: HelpRequestDto }>(
    `/api/help-requests/${requestId}/accept`,
    {
      method: 'POST',
      body: JSON.stringify({ response }),
    },
  )
}

export async function declineHelpRequest(
  requestId: string,
  response?: string,
) {
  return apiRequest<{ ok: true; request: HelpRequestDto }>(
    `/api/help-requests/${requestId}/decline`,
    {
      method: 'POST',
      body: JSON.stringify({ response }),
    },
  )
}

export async function cancelHelpRequest(requestId: string) {
  return apiRequest<{ ok: true; request: HelpRequestDto }>(
    `/api/help-requests/${requestId}/cancel`,
    { method: 'POST' },
  )
}

export async function resolveHelpRequest(requestId: string) {
  return apiRequest<{ ok: true; request: HelpRequestDto }>(
    `/api/help-requests/${requestId}/resolve`,
    { method: 'POST' },
  )
}
