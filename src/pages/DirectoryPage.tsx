import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import DirectoryControls from '../components/DirectoryControls'
import DirectoryEmptyState from '../components/DirectoryEmptyState'
import EmployeeCarousel from '../components/EmployeeCarousel'
import EmployeeProfileDialog from '../components/EmployeeProfileDialog'
import { useEmployeeDirectory } from '../hooks/useEmployeeDirectory'
import type { Employee } from '../data/employee'

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

  return (
    <main className="directory">
      <div className="directory__top">
        <h1
          ref={headingRef}
          className="directory__heading"
          tabIndex={-1}
        >
          Employee Directory
        </h1>
        <Link className="directory__add-link" to="/signup">
          Add employee
        </Link>
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
          <DirectoryEmptyState onClear={clearFilters} />
        ) : (
          <EmployeeCarousel
            key={visibleIdsKey}
            employees={visibleEmployees}
            selectedEmployeeId={nextSelectedId || visibleEmployees[0].id}
            onSelectedEmployeeIdChange={setSelectedEmployeeId}
            onViewProfile={handleViewProfile}
          />
        )}
      </div>

      <EmployeeProfileDialog
        employee={profileEmployee}
        onClose={handleProfileClose}
      />
    </main>
  )
}

export default DirectoryPage
