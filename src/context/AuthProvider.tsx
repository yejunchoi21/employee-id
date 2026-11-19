import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import {
  changePasswordRequest,
  loginRequest,
  logoutRequest,
  meRequest,
  type PublicMembership,
} from '../api/auth'
import { ApiError } from '../api/client'
import {
  fetchDepartments,
  fetchOpenHelpRequestCount,
  fetchPublishedEmployees,
  type PublishedEmployeeDto,
} from '../api/helpRequests'
import { AuthContext } from './authContextObject'

function clearDirectoryCaches(
  setOpenIncomingCount: (value: number) => void,
  setPublishedEmployees: (value: PublishedEmployeeDto[]) => void,
  setDepartmentNamesById: (value: Record<string, string>) => void,
) {
  setOpenIncomingCount(0)
  setPublishedEmployees([])
  setDepartmentNamesById({})
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [membership, setMembership] = useState<PublicMembership | null>(null)
  const [isAuthLoading, setIsAuthLoading] = useState(true)
  const [openIncomingCount, setOpenIncomingCount] = useState(0)
  const [publishedEmployees, setPublishedEmployees] = useState<
    PublishedEmployeeDto[]
  >([])
  const [departmentNamesById, setDepartmentNamesById] = useState<
    Record<string, string>
  >({})
  const [authError, setAuthError] = useState<string | null>(null)

  const refreshOpenIncomingCount = useCallback(async () => {
    try {
      const result = await fetchOpenHelpRequestCount()
      setOpenIncomingCount(result.openCount)
    } catch {
      // Keep last known count if the badge refresh fails.
    }
  }, [])

  const refreshPublishedEmployees = useCallback(async () => {
    try {
      const [published, departments] = await Promise.all([
        fetchPublishedEmployees(),
        fetchDepartments(),
      ])
      setPublishedEmployees(published.employees)
      setDepartmentNamesById(
        Object.fromEntries(
          departments.departments.map((department) => [
            department.id,
            department.name,
          ]),
        ),
      )
    } catch {
      setPublishedEmployees([])
    }
  }, [])

  useEffect(() => {
    let cancelled = false

    async function hydrate() {
      setIsAuthLoading(true)
      try {
        const result = await meRequest()
        if (!cancelled) {
          setMembership(result.membership)
          setAuthError(null)
        }
      } catch (error) {
        if (!cancelled) {
          setMembership(null)
          clearDirectoryCaches(
            setOpenIncomingCount,
            setPublishedEmployees,
            setDepartmentNamesById,
          )
          if (!(error instanceof ApiError && error.status === 401)) {
            setAuthError(
              'Could not reach the auth server. Start the API on port 4000.',
            )
          }
        }
      } finally {
        if (!cancelled) setIsAuthLoading(false)
      }
    }

    void hydrate()
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (!membership || membership.mustChangePassword) {
      return
    }

    let cancelled = false

    async function loadSignedInData() {
      try {
        const [countResult, published, departments] = await Promise.all([
          fetchOpenHelpRequestCount(),
          fetchPublishedEmployees(),
          fetchDepartments(),
        ])
        if (cancelled) return
        setOpenIncomingCount(countResult.openCount)
        setPublishedEmployees(published.employees)
        setDepartmentNamesById(
          Object.fromEntries(
            departments.departments.map((department) => [
              department.id,
              department.name,
            ]),
          ),
        )
      } catch {
        if (!cancelled) {
          setPublishedEmployees([])
        }
      }
    }

    void loadSignedInData()
    return () => {
      cancelled = true
    }
  }, [membership])

  const login = useCallback(async (email: string, password: string) => {
    try {
      const result = await loginRequest(email, password)
      setMembership(result.membership)
      setAuthError(null)
      return { ok: true as const }
    } catch (error) {
      const message =
        error instanceof ApiError
          ? error.message
          : 'Unable to sign in. Check that the API is running.'
      return { ok: false as const, error: message }
    }
  }, [])

  const changePassword = useCallback(
    async (currentPassword: string, newPassword: string) => {
      try {
        const result = await changePasswordRequest(
          currentPassword,
          newPassword,
        )
        setMembership(result.membership)
        return { ok: true as const }
      } catch (error) {
        const message =
          error instanceof ApiError
            ? error.message
            : 'Could not change password.'
        return { ok: false as const, error: message }
      }
    },
    [],
  )

  const logout = useCallback(async () => {
    try {
      await logoutRequest()
    } catch {
      // Clear local session even if the network call fails.
    }
    setMembership(null)
    clearDirectoryCaches(
      setOpenIncomingCount,
      setPublishedEmployees,
      setDepartmentNamesById,
    )
  }, [])

  const value = useMemo(
    () => ({
      membership,
      isAuthLoading,
      openIncomingCount,
      publishedEmployees,
      departmentNamesById,
      authError,
      login,
      logout,
      changePassword,
      refreshOpenIncomingCount,
      refreshPublishedEmployees,
    }),
    [
      membership,
      isAuthLoading,
      openIncomingCount,
      publishedEmployees,
      departmentNamesById,
      authError,
      login,
      logout,
      changePassword,
      refreshOpenIncomingCount,
      refreshPublishedEmployees,
    ],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
