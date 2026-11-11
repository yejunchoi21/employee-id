import { useContext } from 'react'
import { EmployeeDirectoryContext } from '../context/employeeDirectoryContextObject'

export function useEmployeeDirectory() {
  const context = useContext(EmployeeDirectoryContext)
  if (!context) {
    throw new Error(
      'useEmployeeDirectory must be used within EmployeeDirectoryProvider',
    )
  }
  return context
}
