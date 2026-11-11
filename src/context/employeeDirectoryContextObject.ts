import { createContext } from 'react'
import type { Employee } from '../data/employee'
import type { EmployeeSignupInput } from '../utils/createEmployee'
import type { SortOrder } from '../utils/employeeFilters'

export interface CreateEmployeeResult {
  ok: true
  employee: Employee
}

export interface CreateEmployeeFailure {
  ok: false
  error: string
}

export type CreateResult = CreateEmployeeResult | CreateEmployeeFailure

export interface EmployeeDirectoryContextValue {
  allEmployees: Employee[]
  customEmployees: Employee[]
  departments: string[]
  search: string
  department: string
  sort: SortOrder
  selectedEmployeeId: string
  setSearch: (value: string) => void
  setDepartment: (value: string) => void
  setSort: (value: SortOrder) => void
  setSelectedEmployeeId: (value: string) => void
  clearFilters: () => void
  getVisibleEmployees: () => Employee[]
  createEmployee: (input: EmployeeSignupInput) => CreateResult
}

export const EmployeeDirectoryContext =
  createContext<EmployeeDirectoryContextValue | null>(null)
