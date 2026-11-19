import { createContext } from 'react'
import type { PublicMembership } from '../api/auth'
import type { PublishedEmployeeDto } from '../api/helpRequests'

export interface AuthContextValue {
  membership: PublicMembership | null
  isAuthLoading: boolean
  openIncomingCount: number
  publishedEmployees: PublishedEmployeeDto[]
  departmentNamesById: Record<string, string>
  authError: string | null
  login: (email: string, password: string) => Promise<{ ok: true } | { ok: false; error: string }>
  logout: () => Promise<void>
  refreshOpenIncomingCount: () => Promise<void>
  refreshPublishedEmployees: () => Promise<void>
}

export const AuthContext = createContext<AuthContextValue | null>(null)
