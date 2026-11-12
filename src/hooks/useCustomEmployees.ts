import { useCallback, useEffect, useState } from 'react'
import { portraitPlaceholder, type Employee } from '../data/employee'
import {
  deletePortraitBlob,
  getPortraitBlob,
  savePortraitBlob,
} from '../utils/portraitDb'

const STORAGE_KEY = 'northline-custom-employees'

export type SaveResult =
  | { ok: true }
  | { ok: false; error: string }

type StoredEmployee = Omit<Employee, 'photoUrl'> & {
  photoUrl?: string
}

function readStoredEmployees(): StoredEmployee[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return []

    const parsed: unknown = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []

    return parsed.filter((item): item is StoredEmployee => {
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
  } catch {
    return []
  }
}

function toStoredEmployee(employee: Employee): StoredEmployee {
  const { photoUrl, ...rest } = employee
  void photoUrl
  return {
    ...rest,
    // Never persist runtime object URLs or large image payloads in localStorage.
    photoUrl: undefined,
  }
}

function persistEmployees(employees: Employee[]): SaveResult {
  try {
    const payload = employees.map(toStoredEmployee)
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload))
    return { ok: true }
  } catch {
    return {
      ok: false,
      error: 'Could not save your card in this browser. Please try again.',
    }
  }
}

async function hydrateEmployee(stored: StoredEmployee): Promise<Employee> {
  const base: Employee = {
    id: stored.id,
    name: stored.name,
    title: stored.title,
    department: stored.department,
    company: stored.company || 'Northline Collective',
    initials: stored.initials || 'NA',
    office: stored.office || '',
    joined: stored.joined || '',
    photoUrl: portraitPlaceholder,
    email: stored.email || '',
    phone: stored.phone || '',
    manager: stored.manager || '',
    bio: stored.bio || '',
    skills: stored.skills,
  }

  if (!stored.portraitId) {
    return base
  }

  try {
    const blob = await getPortraitBlob(stored.portraitId)
    if (!blob) {
      return base
    }
    return {
      ...base,
      portraitId: stored.portraitId,
      photoUrl: URL.createObjectURL(blob),
    }
  } catch {
    return {
      ...base,
      portraitId: stored.portraitId,
      photoUrl: portraitPlaceholder,
    }
  }
}

export function useCustomEmployees() {
  const [customEmployees, setCustomEmployees] = useState<Employee[]>([])
  const [isReady, setIsReady] = useState(false)

  useEffect(() => {
    let cancelled = false
    const objectUrls: string[] = []

    ;(async () => {
      const stored = readStoredEmployees()
      const hydrated = await Promise.all(stored.map(hydrateEmployee))
      for (const employee of hydrated) {
        if (employee.photoUrl.startsWith('blob:')) {
          objectUrls.push(employee.photoUrl)
        }
      }
      if (!cancelled) {
        setCustomEmployees(hydrated)
        setIsReady(true)
      }
    })()

    return () => {
      cancelled = true
      for (const url of objectUrls) {
        URL.revokeObjectURL(url)
      }
    }
  }, [])

  const addCustomEmployee = useCallback(
    async (
      employee: Employee,
      portraitBlob?: Blob | null,
    ): Promise<SaveResult> => {
      let portraitSaved = false

      try {
        if (employee.portraitId && portraitBlob) {
          await savePortraitBlob(employee.portraitId, portraitBlob)
          portraitSaved = true
        }

        const next = [...customEmployees, employee]
        const saveResult = persistEmployees(next)
        if (!saveResult.ok) {
          if (portraitSaved && employee.portraitId) {
            await deletePortraitBlob(employee.portraitId)
          }
          return saveResult
        }

        setCustomEmployees(next)
        return { ok: true }
      } catch {
        if (portraitSaved && employee.portraitId) {
          try {
            await deletePortraitBlob(employee.portraitId)
          } catch {
            // Ignore cleanup failures after a save error.
          }
        }
        return {
          ok: false,
          error: 'Could not save your card in this browser. Please try again.',
        }
      }
    },
    [customEmployees],
  )

  const updateCustomEmployee = useCallback(
    async (
      employee: Employee,
      options?: {
        portraitBlob?: Blob | null
        previousPortraitId?: string
        removePortrait?: boolean
      },
    ): Promise<SaveResult> => {
      const index = customEmployees.findIndex((item) => item.id === employee.id)
      if (index < 0) {
        return {
          ok: false,
          error: 'Only cards you added can be edited.',
        }
      }

      let portraitSaved = false
      const previousPortraitId = options?.previousPortraitId
      const nextPortraitId = employee.portraitId

      try {
        if (options?.portraitBlob && nextPortraitId) {
          await savePortraitBlob(nextPortraitId, options.portraitBlob)
          portraitSaved = true
        }

        const next = [...customEmployees]
        const previous = next[index]
        next[index] = employee

        const saveResult = persistEmployees(next)
        if (!saveResult.ok) {
          if (portraitSaved && nextPortraitId) {
            await deletePortraitBlob(nextPortraitId)
          }
          return saveResult
        }

        if (
          previous.photoUrl.startsWith('blob:') &&
          previous.photoUrl !== employee.photoUrl
        ) {
          URL.revokeObjectURL(previous.photoUrl)
        }

        if (
          options?.removePortrait &&
          previousPortraitId &&
          previousPortraitId !== nextPortraitId
        ) {
          await deletePortraitBlob(previousPortraitId)
        } else if (
          options?.portraitBlob &&
          previousPortraitId &&
          previousPortraitId !== nextPortraitId
        ) {
          await deletePortraitBlob(previousPortraitId)
        }

        setCustomEmployees(next)
        return { ok: true }
      } catch {
        if (portraitSaved && nextPortraitId) {
          try {
            await deletePortraitBlob(nextPortraitId)
          } catch {
            // Ignore cleanup failures after a save error.
          }
        }
        return {
          ok: false,
          error: 'Could not save your changes in this browser. Please try again.',
        }
      }
    },
    [customEmployees],
  )

  const removeCustomEmployee = useCallback(
    async (employeeId: string): Promise<SaveResult> => {
      const index = customEmployees.findIndex((item) => item.id === employeeId)
      if (index < 0) {
        return {
          ok: false,
          error: 'Only cards you added can be deleted.',
        }
      }

      const existing = customEmployees[index]
      const next = customEmployees.filter((item) => item.id !== employeeId)
      const saveResult = persistEmployees(next)
      if (!saveResult.ok) {
        return saveResult
      }

      if (existing.photoUrl.startsWith('blob:')) {
        URL.revokeObjectURL(existing.photoUrl)
      }

      if (existing.portraitId) {
        try {
          await deletePortraitBlob(existing.portraitId)
        } catch {
          // Card is already removed from storage; ignore portrait cleanup failures.
        }
      }

      setCustomEmployees(next)
      return { ok: true }
    },
    [customEmployees],
  )

  return {
    customEmployees,
    addCustomEmployee,
    updateCustomEmployee,
    removeCustomEmployee,
    isReady,
  }
}
