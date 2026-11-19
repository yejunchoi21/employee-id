import type { PublishedEmployeeDto } from '../api/helpRequests'
import { portraitPlaceholder, type Employee } from '../data/employee'

export function mapPublishedEmployeeToDirectory(
  employee: PublishedEmployeeDto,
  departmentName: string,
  companyName = 'Northline Collective',
): Employee {
  return {
    id: employee.employeeCode || employee.id,
    serverEmployeeId: employee.id,
    name: employee.name,
    title: employee.title,
    department: departmentName || 'Directory',
    company: companyName,
    initials: employee.initials,
    office: employee.office,
    joined: employee.joined,
    photoUrl: portraitPlaceholder,
    email: employee.email,
    phone: employee.phone,
    manager: employee.manager,
    bio: employee.bio,
    skills: employee.skills,
  }
}

export function mergeLocalAndPublishedEmployees(
  localEmployees: Employee[],
  publishedEmployees: PublishedEmployeeDto[],
  departmentNamesById: Record<string, string>,
): Employee[] {
  const publishedByEmail = new Map(
    publishedEmployees.map((employee) => [
      employee.email.trim().toLowerCase(),
      employee,
    ]),
  )

  const merged = localEmployees.map((employee) => {
    const published = publishedByEmail.get(employee.email.trim().toLowerCase())
    if (!published) return employee
    return {
      ...employee,
      serverEmployeeId: published.id,
    }
  })

  const localEmails = new Set(
    localEmployees.map((employee) => employee.email.trim().toLowerCase()),
  )

  for (const published of publishedEmployees) {
    const email = published.email.trim().toLowerCase()
    if (localEmails.has(email)) continue
    merged.push(
      mapPublishedEmployeeToDirectory(
        published,
        departmentNamesById[published.departmentId] ?? 'Directory',
      ),
    )
  }

  return merged
}
