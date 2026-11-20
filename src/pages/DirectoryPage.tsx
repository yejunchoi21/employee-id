import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link as RouterLink, useLocation, useNavigate } from 'react-router-dom'
import { Box, Button, Typography } from '@mui/material'
import DirectoryControls from '../components/DirectoryControls'
import DirectoryEmptyState from '../components/DirectoryEmptyState'
import EmployeeCarousel from '../components/EmployeeCarousel'
import EmployeeEditDialog from '../components/EmployeeEditDialog'
import EmployeeGrid from '../components/EmployeeGrid'
import EmployeeList from '../components/EmployeeList'
import EmployeeProfileDialog from '../components/EmployeeProfileDialog'
import PageHeader from '../components/PageHeader'
import RequestHelpDialog from '../components/RequestHelpDialog'
import { useAuth } from '../hooks/useAuth'
import { useEmployeeDirectory } from '../hooks/useEmployeeDirectory'
import type { Employee } from '../data/employee'
import type { EmployeeSignupInput } from '../utils/createEmployee'
import type { DirectoryViewMode } from '../utils/employeeFilters'

interface DirectoryLocationState {
  focusEmployeeId?: string
}

const VIEW_STORAGE_KEY = 'northline-directory-view'

function readStoredView(): DirectoryViewMode {
  try {
    const raw = window.localStorage.getItem(VIEW_STORAGE_KEY)
    if (raw === 'cards' || raw === 'grid' || raw === 'list') return raw
  } catch {
    // Ignore storage failures and fall back to cards.
  }
  return 'cards'
}

function DirectoryPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const headingRef = useRef<HTMLHeadingElement>(null)
  const profileTriggerRef = useRef<HTMLElement | null>(null)
  const [profileEmployeeId, setProfileEmployeeId] = useState<string | null>(
    null,
  )
  const [editEmployeeId, setEditEmployeeId] = useState<string | null>(null)
  const [helpEmployeeId, setHelpEmployeeId] = useState<string | null>(null)
  const [view, setView] = useState<DirectoryViewMode>(() => readStoredView())
  const { membership, refreshOpenIncomingCount } = useAuth()

  const {
    allEmployees,
    departments,
    search,
    department,
    sort,
    selectedEmployeeId,
    setSearch,
    setDepartment,
    setSort,
    setSelectedEmployeeId,
    clearFilters,
    getVisibleEmployees,
    isOwnedEmployee,
    updateEmployee,
    deleteEmployee,
  } = useEmployeeDirectory()

  const locationState = (location.state as DirectoryLocationState | null) ?? null

  useEffect(() => {
    headingRef.current?.focus()
  }, [])

  useEffect(() => {
    const focusEmployeeId = locationState?.focusEmployeeId
    if (!focusEmployeeId) return

    clearFilters()
    setSelectedEmployeeId(focusEmployeeId)
    navigate(location.pathname, { replace: true, state: null })
  }, [
    clearFilters,
    location.pathname,
    locationState?.focusEmployeeId,
    navigate,
    setSelectedEmployeeId,
  ])

  const visibleEmployees = useMemo(
    () => getVisibleEmployees(),
    [getVisibleEmployees],
  )

  const visibleIdsKey = visibleEmployees.map((employee) => employee.id).join('|')

  const nextSelectedId =
    visibleEmployees.find((employee) => employee.id === selectedEmployeeId)
      ?.id ??
    visibleEmployees[0]?.id ??
    ''

  if (nextSelectedId && nextSelectedId !== selectedEmployeeId) {
    setSelectedEmployeeId(nextSelectedId)
  }

  const profileEmployee =
    allEmployees.find((employee) => employee.id === profileEmployeeId) ?? null
  const editEmployee =
    allEmployees.find((employee) => employee.id === editEmployeeId) ?? null
  const helpEmployee =
    allEmployees.find((employee) => employee.id === helpEmployeeId) ?? null

  const canRequestHelp = Boolean(
    membership &&
      profileEmployee?.serverEmployeeId &&
      profileEmployee.email.trim().toLowerCase() !==
        membership.email.trim().toLowerCase(),
  )

  const hasAnyEmployees = allEmployees.length > 0
  const filtersActive =
    search.trim().length > 0 || department !== 'all' || sort !== 'asc'
  const hasDemoProfiles = allEmployees.some((employee) => employee.isDemo)

  const handleViewChange = useCallback((nextView: DirectoryViewMode) => {
    setView(nextView)
    try {
      window.localStorage.setItem(VIEW_STORAGE_KEY, nextView)
    } catch {
      // Ignore persistence failures.
    }
  }, [])

  const handleViewProfile = useCallback((employee: Employee) => {
    profileTriggerRef.current = document.activeElement as HTMLElement | null
    setProfileEmployeeId(employee.id)
  }, [])

  const handleProfileClose = useCallback(() => {
    setProfileEmployeeId(null)
    window.requestAnimationFrame(() => {
      profileTriggerRef.current?.focus()
      profileTriggerRef.current = null
    })
  }, [])

  const handleEditEmployee = useCallback((employee: Employee) => {
    if (!isOwnedEmployee(employee.id)) return
    setProfileEmployeeId(null)
    setEditEmployeeId(employee.id)
  }, [isOwnedEmployee])

  const handleEditClose = useCallback(() => {
    setEditEmployeeId(null)
  }, [])

  const handleEditSave = useCallback(
    async (employeeId: string, input: EmployeeSignupInput) => {
      const result = await updateEmployee(employeeId, input)
      if (!result.ok) {
        return result
      }
      return { ok: true as const }
    },
    [updateEmployee],
  )

  const handleDeleteEmployee = useCallback(
    async (employee: Employee) => {
      if (!isOwnedEmployee(employee.id)) return

      const confirmed = window.confirm(
        `Delete ${employee.name}'s card? This cannot be undone.`,
      )
      if (!confirmed) return

      const result = await deleteEmployee(employee.id)
      if (!result.ok) {
        window.alert(result.error)
        return
      }

      setProfileEmployeeId(null)
      setEditEmployeeId(null)
    },
    [deleteEmployee, isOwnedEmployee],
  )

  const handleEditDelete = useCallback(
    async (employee: Employee) => {
      if (!isOwnedEmployee(employee.id)) return

      const result = await deleteEmployee(employee.id)
      if (!result.ok) {
        throw new Error(result.error)
      }

      setProfileEmployeeId(null)
      setEditEmployeeId(null)
    },
    [deleteEmployee, isOwnedEmployee],
  )

  const handleRequestHelp = useCallback((employee: Employee) => {
    setHelpEmployeeId(employee.id)
  }, [])

  const handleHelpClose = useCallback(() => {
    setHelpEmployeeId(null)
  }, [])

  return (
    <Box component="main">
      <PageHeader
        eyebrow="Staff roster"
        title="Employee Directory"
        description="Search by expertise, switch between cards, grid, or list, and open a profile to email or copy contact details."
        titleRef={headingRef}
        actions={
          <Button component={RouterLink} to="/signup" variant="contained">
            Add employee
          </Button>
        }
      />
      {hasDemoProfiles ? (
        <Typography variant="body2" sx={{ mb: 2 }}>
          Demo profiles are labeled and fictional. Your saved cards stay in this
          browser and are never overwritten.
        </Typography>
      ) : null}
      <DirectoryControls
        search={search}
        department={department}
        sort={sort}
        view={view}
        departments={departments}
        resultCount={visibleEmployees.length}
        onSearchChange={setSearch}
        onDepartmentChange={setDepartment}
        onSortChange={setSort}
        onViewChange={handleViewChange}
        onClear={clearFilters}
      />

      <div id="employee-rack">
        {visibleEmployees.length === 0 ? (
          <DirectoryEmptyState
            hasAnyEmployees={hasAnyEmployees}
            filtersActive={filtersActive}
            onClear={clearFilters}
          />
        ) : view === 'cards' ? (
          <EmployeeCarousel
            key={visibleIdsKey}
            employees={visibleEmployees}
            selectedEmployeeId={nextSelectedId || visibleEmployees[0].id}
            onSelectedEmployeeIdChange={setSelectedEmployeeId}
            onViewProfile={handleViewProfile}
            canEditEmployee={isOwnedEmployee}
            onEditEmployee={handleEditEmployee}
            onDeleteEmployee={(employee) => {
              void handleDeleteEmployee(employee)
            }}
          />
        ) : view === 'grid' ? (
          <EmployeeGrid
            employees={visibleEmployees}
            onViewProfile={handleViewProfile}
          />
        ) : (
          <EmployeeList
            employees={visibleEmployees}
            onViewProfile={handleViewProfile}
          />
        )}
      </div>

      <EmployeeProfileDialog
        employee={profileEmployee}
        canEdit={
          profileEmployee ? isOwnedEmployee(profileEmployee.id) : false
        }
        canRequestHelp={canRequestHelp}
        onClose={handleProfileClose}
        onEdit={handleEditEmployee}
        onDelete={(employee) => {
          void handleDeleteEmployee(employee)
        }}
        onRequestHelp={handleRequestHelp}
      />

      <RequestHelpDialog
        employee={helpEmployee}
        recipientEmployeeId={helpEmployee?.serverEmployeeId ?? null}
        onClose={handleHelpClose}
        onCreated={() => {
          void refreshOpenIncomingCount()
        }}
      />

      <EmployeeEditDialog
        employee={editEmployee}
        onClose={handleEditClose}
        onSave={handleEditSave}
        onDelete={handleEditDelete}
      />
    </Box>
  )
}

export default DirectoryPage
