import { useCallback, useMemo, useState, type ReactNode } from 'react'
import { employees as seedEmployees } from '../data/employee'
import { useCustomEmployees, type SaveResult } from '../hooks/useCustomEmployees'
import {
  createEmployeeFromSignup,
  type EmployeeSignupInput,
} from '../utils/createEmployee'
import {
  filterAndSortEmployees,
  getDepartments,
  type SortOrder,
} from '../utils/employeeFilters'
import {
  EmployeeDirectoryContext,
  type CreateResult,
} from './employeeDirectoryContextObject'

export function EmployeeDirectoryProvider({
  children,
}: {
  children: ReactNode
}) {
  const { customEmployees, addCustomEmployee } = useCustomEmployees()
  const [search, setSearch] = useState('')
  const [department, setDepartment] = useState('all')
  const [sort, setSort] = useState<SortOrder>('asc')
  const [selectedEmployeeId, setSelectedEmployeeId] = useState(
    seedEmployees[0]?.id ?? '',
  )

  const allEmployees = useMemo(
    () => [...seedEmployees, ...customEmployees],
    [customEmployees],
  )

  const departments = useMemo(
    () => getDepartments(allEmployees),
    [allEmployees],
  )

  const clearFilters = useCallback(() => {
    setSearch('')
    setDepartment('all')
    setSort('asc')
  }, [])

  const getVisibleEmployees = useCallback(
    () =>
      filterAndSortEmployees(allEmployees, {
        search,
        department,
        sort,
      }),
    [allEmployees, search, department, sort],
  )

  const createEmployee = useCallback(
    (input: EmployeeSignupInput): CreateResult => {
      const email = input.email.trim().toLowerCase()
      const duplicate = allEmployees.some(
        (employee) => employee.email.trim().toLowerCase() === email,
      )

      if (duplicate) {
        return {
          ok: false,
          error:
            'An employee with this email is already in the directory. Use a different email.',
        }
      }

      const hasSkills = input.skills
        .split(',')
        .map((skill) => skill.trim())
        .filter(Boolean).length > 0

      if (!hasSkills) {
        return {
          ok: false,
          error: 'Add at least one skill, separated by commas.',
        }
      }

      const employee = createEmployeeFromSignup(
        input,
        allEmployees.map((item) => item.id),
      )

      const saveResult: SaveResult = addCustomEmployee(employee)
      if (!saveResult.ok) {
        return saveResult
      }

      clearFilters()
      setSelectedEmployeeId(employee.id)

      return { ok: true, employee }
    },
    [addCustomEmployee, allEmployees, clearFilters],
  )

  const value = useMemo(
    () => ({
      allEmployees,
      customEmployees,
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
      createEmployee,
    }),
    [
      allEmployees,
      clearFilters,
      createEmployee,
      customEmployees,
      department,
      departments,
      getVisibleEmployees,
      search,
      selectedEmployeeId,
      sort,
    ],
  )

  return (
    <EmployeeDirectoryContext.Provider value={value}>
      {children}
    </EmployeeDirectoryContext.Provider>
  )
}
