import type { Employee } from '../data/employee'

export type SortOrder = 'asc' | 'desc'

export interface EmployeeFilterOptions {
  search: string
  department: string
  sort: SortOrder
}

export function getDepartments(employees: readonly Employee[]): string[] {
  return [...new Set(employees.map((employee) => employee.department))].sort(
    (a, b) => a.localeCompare(b),
  )
}

function normalize(value: string) {
  return value.trim().toLowerCase()
}

function matchesSearch(employee: Employee, query: string) {
  if (!query) return true

  const haystack = [
    employee.name,
    employee.id,
    employee.title,
    employee.department,
  ]
    .join(' ')
    .toLowerCase()

  return haystack.includes(query)
}

export function filterAndSortEmployees(
  employees: readonly Employee[],
  { search, department, sort }: EmployeeFilterOptions,
): Employee[] {
  const query = normalize(search)

  const filtered = employees.filter((employee) => {
    const matchesDepartment =
      department === 'all' || employee.department === department
    return matchesDepartment && matchesSearch(employee, query)
  })

  return [...filtered].sort((a, b) => {
    const comparison = a.name.localeCompare(b.name, undefined, {
      sensitivity: 'base',
    })
    return sort === 'asc' ? comparison : -comparison
  })
}
