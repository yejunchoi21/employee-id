import { useCallback, useMemo, useState, type ReactNode } from 'react'
import {
  employees as seedEmployees,
  portraitPlaceholder,
} from '../data/employee'
import { useCustomEmployees, type SaveResult } from '../hooks/useCustomEmployees'
import {
  applyEmployeeUpdate,
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
  const {
    customEmployees,
    addCustomEmployee,
    updateCustomEmployee,
    removeCustomEmployee,
    isReady,
  } = useCustomEmployees()
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

  const isOwnedEmployee = useCallback(
    (employeeId: string) =>
      customEmployees.some((employee) => employee.id === employeeId),
    [customEmployees],
  )

  const createEmployee = useCallback(
    async (input: EmployeeSignupInput): Promise<CreateResult> => {
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

      const persistentPhotoUrl = input.portraitBlob
        ? URL.createObjectURL(input.portraitBlob)
        : undefined

      const employee = createEmployeeFromSignup(
        {
          ...input,
          portraitId: input.portraitBlob ? input.portraitId : undefined,
          photoUrl: persistentPhotoUrl,
        },
        allEmployees.map((item) => item.id),
      )

      const saveResult: SaveResult = await addCustomEmployee(
        employee,
        input.portraitBlob ?? null,
      )
      if (!saveResult.ok && persistentPhotoUrl) {
        URL.revokeObjectURL(persistentPhotoUrl)
      }
      if (!saveResult.ok) {
        return saveResult
      }

      clearFilters()
      setSelectedEmployeeId(employee.id)

      return { ok: true, employee }
    },
    [addCustomEmployee, allEmployees, clearFilters],
  )

  const updateEmployee = useCallback(
    async (
      employeeId: string,
      input: EmployeeSignupInput,
    ): Promise<CreateResult> => {
      const existing = customEmployees.find(
        (employee) => employee.id === employeeId,
      )
      if (!existing) {
        return {
          ok: false,
          error: 'Only cards you added can be edited.',
        }
      }

      const email = input.email.trim().toLowerCase()
      const duplicate = allEmployees.some(
        (employee) =>
          employee.id !== employeeId &&
          employee.email.trim().toLowerCase() === email,
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

      const previousPortraitId = existing.portraitId
      let persistentPhotoUrl: string | undefined
      let nextInput = { ...input }

      if (input.removePortrait) {
        nextInput = {
          ...nextInput,
          portraitId: undefined,
          photoUrl: portraitPlaceholder,
          portraitBlob: null,
        }
      } else if (input.portraitBlob) {
        const portraitId = input.portraitId || crypto.randomUUID()
        persistentPhotoUrl = URL.createObjectURL(input.portraitBlob)
        nextInput = {
          ...nextInput,
          portraitId,
          photoUrl: persistentPhotoUrl,
        }
      }

      const updated = applyEmployeeUpdate(existing, nextInput)
      const saveResult = await updateCustomEmployee(updated, {
        portraitBlob: input.portraitBlob ?? null,
        previousPortraitId,
        removePortrait: Boolean(input.removePortrait),
      })

      if (!saveResult.ok) {
        if (persistentPhotoUrl) {
          URL.revokeObjectURL(persistentPhotoUrl)
        }
        return saveResult
      }

      setSelectedEmployeeId(updated.id)
      return { ok: true, employee: updated }
    },
    [allEmployees, customEmployees, updateCustomEmployee],
  )

  const deleteEmployee = useCallback(
    async (employeeId: string): Promise<CreateResult> => {
      const existing = customEmployees.find(
        (employee) => employee.id === employeeId,
      )
      if (!existing) {
        return {
          ok: false,
          error: 'Only cards you added can be deleted.',
        }
      }

      const saveResult = await removeCustomEmployee(employeeId)
      if (!saveResult.ok) {
        return saveResult
      }

      if (selectedEmployeeId === employeeId) {
        const remaining = allEmployees.filter(
          (employee) => employee.id !== employeeId,
        )
        setSelectedEmployeeId(remaining[0]?.id ?? '')
      }

      return { ok: true, employee: existing }
    },
    [
      allEmployees,
      customEmployees,
      removeCustomEmployee,
      selectedEmployeeId,
    ],
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
      isDirectoryReady: isReady,
      setSearch,
      setDepartment,
      setSort,
      setSelectedEmployeeId,
      clearFilters,
      getVisibleEmployees,
      isOwnedEmployee,
      createEmployee,
      updateEmployee,
      deleteEmployee,
    }),
    [
      allEmployees,
      clearFilters,
      createEmployee,
      customEmployees,
      deleteEmployee,
      department,
      departments,
      getVisibleEmployees,
      isOwnedEmployee,
      isReady,
      search,
      selectedEmployeeId,
      sort,
      updateEmployee,
    ],
  )

  return (
    <EmployeeDirectoryContext.Provider value={value}>
      {children}
    </EmployeeDirectoryContext.Provider>
  )
}
