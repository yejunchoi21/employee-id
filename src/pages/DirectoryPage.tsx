import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import DirectoryControls from '../components/DirectoryControls'
import DirectoryEmptyState from '../components/DirectoryEmptyState'
import EmployeeCarousel from '../components/EmployeeCarousel'
import EmployeeEditDialog from '../components/EmployeeEditDialog'
import EmployeeProfileDialog from '../components/EmployeeProfileDialog'
import { useEmployeeDirectory } from '../hooks/useEmployeeDirectory'
import type { Employee } from '../data/employee'
import type { EmployeeSignupInput } from '../utils/createEmployee'

interface DirectoryLocationState {
  focusEmployeeId?: string
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

  const hasAnyEmployees = allEmployees.length > 0
  const filtersActive =
    search.trim().length > 0 || department !== 'all' || sort !== 'asc'

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

  return (
    <main className="page">
      <div className="page__hero">
        <p className="page__kicker">Staff roster</p>
        <h1 ref={headingRef} className="page__heading" tabIndex={-1}>
          Employee Directory
        </h1>
        <p className="page__lede">
          Browse the Northline coat rack, isolate a card for details, and keep
          your own badge up to date.
        </p>
        <div className="page__actions">
          <Link className="page__button" to="/signup">
            Add employee
          </Link>
        </div>
      </div>

      <DirectoryControls
        search={search}
        department={department}
        sort={sort}
        departments={departments}
        resultCount={visibleEmployees.length}
        onSearchChange={setSearch}
        onDepartmentChange={setDepartment}
        onSortChange={setSort}
        onClear={clearFilters}
      />

      <div id="employee-rack">
        {visibleEmployees.length === 0 ? (
          <DirectoryEmptyState
            hasAnyEmployees={hasAnyEmployees}
            filtersActive={filtersActive}
            onClear={clearFilters}
          />
        ) : (
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
        )}
      </div>

      <EmployeeProfileDialog
        employee={profileEmployee}
        canEdit={
          profileEmployee ? isOwnedEmployee(profileEmployee.id) : false
        }
        onClose={handleProfileClose}
        onEdit={handleEditEmployee}
        onDelete={(employee) => {
          void handleDeleteEmployee(employee)
        }}
      />

      <EmployeeEditDialog
        employee={editEmployee}
        onClose={handleEditClose}
        onSave={handleEditSave}
        onDelete={handleEditDelete}
      />
    </main>
  )
}

export default DirectoryPage
