import { apiRequest } from './client'

export interface PublicMembership {
  membershipId: string
  companyId: string
  email: string
  displayName: string
  role: 'admin' | 'member'
  employeeId: string | null
  mustChangePassword: boolean
}

export async function loginRequest(email: string, password: string) {
  return apiRequest<{ ok: true; membership: PublicMembership }>(
    '/api/auth/login',
    {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    },
  )
}

export async function logoutRequest() {
  return apiRequest<{ ok: true }>('/api/auth/logout', { method: 'POST' })
}

export async function meRequest() {
  return apiRequest<{ ok: true; membership: PublicMembership }>('/api/auth/me')
}

export async function changePasswordRequest(
  currentPassword: string,
  newPassword: string,
) {
  return apiRequest<{ ok: true; membership: PublicMembership }>(
    '/api/auth/change-password',
    {
      method: 'POST',
      body: JSON.stringify({ currentPassword, newPassword }),
    },
  )
}

export interface CreateEmployeeAccountInput {
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
  skills: string
}

export async function createEmployeeAccountRequest(
  input: CreateEmployeeAccountInput,
) {
  return apiRequest<{
    ok: true
    membership: PublicMembership
    employee: { id: string; email: string; name: string; employeeCode: string }
    linkedExistingProfile: boolean
  }>('/api/admin/employee-accounts', {
    method: 'POST',
    body: JSON.stringify(input),
  })
}
