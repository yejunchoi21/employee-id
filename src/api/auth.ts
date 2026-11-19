import { apiRequest } from './client'

export interface PublicMembership {
  membershipId: string
  companyId: string
  email: string
  displayName: string
  role: 'admin' | 'member'
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
