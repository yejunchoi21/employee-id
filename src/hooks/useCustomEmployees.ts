import { useCallback, useState } from 'react'
import portraitPlaceholder from '../assets/portrait-placeholder.svg'
import type { Employee } from '../data/employee'

const STORAGE_KEY = 'northline-custom-employees'

export type SaveResult =
  | { ok: true }
  | { ok: false; error: string }

function readStoredEmployees(): Employee[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return []

    const parsed: unknown = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []

    return parsed
      .filter((item): item is Employee => {
        if (!item || typeof item !== 'object') return false
        const employee = item as Partial<Employee>
        return (
          typeof employee.id === 'string' &&
          typeof employee.name === 'string' &&
          typeof employee.title === 'string' &&
          typeof employee.department === 'string' &&
          Array.isArray(employee.skills)
        )
      })
      .map((employee) => ({
        ...employee,
        photoUrl: portraitPlaceholder,
        company: employee.company || 'Northline Collective',
        initials: employee.initials || 'NA',
        office: employee.office || '',
        joined: employee.joined || '',
        email: employee.email || '',
        phone: employee.phone || '',
        manager: employee.manager || '',
        bio: employee.bio || '',
      }))
  } catch {
    return []
  }
}

function persistEmployees(employees: Employee[]): SaveResult {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(employees))
    return { ok: true }
  } catch {
    return {
      ok: false,
      error: 'Could not save your card in this browser. Please try again.',
    }
  }
}

export function useCustomEmployees() {
  const [customEmployees, setCustomEmployees] = useState<Employee[]>(() =>
    typeof window === 'undefined' ? [] : readStoredEmployees(),
  )

  const addCustomEmployee = useCallback(
    (employee: Employee): SaveResult => {
      const next = [...customEmployees, employee]
      const saveResult = persistEmployees(next)
      if (!saveResult.ok) {
        return saveResult
      }

      setCustomEmployees(next)
      return { ok: true }
    },
    [customEmployees],
  )

  return {
    customEmployees,
    addCustomEmployee,
  }
}
