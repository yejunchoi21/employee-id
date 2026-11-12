import { portraitPlaceholder, type Employee } from '../data/employee'

export interface EmployeeSignupInput {
  name: string
  title: string
  department: string
  office: string
  email: string
  phone: string
  manager: string
  bio: string
  skills: string
  portraitId?: string
  photoUrl?: string
  /** Processed portrait blob kept only in memory until IndexedDB save. */
  portraitBlob?: Blob | null
  /** When editing, clear the saved custom portrait and use the placeholder. */
  removePortrait?: boolean
}

function trimField(value: string) {
  return value.trim()
}

export function getInitials(name: string) {
  const parts = name
    .trim()
    .split(/\s+/)
    .filter(Boolean)

  if (parts.length === 0) return 'NA'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
}

export function parseSkills(skills: string) {
  return [
    ...new Set(
      skills
        .split(',')
        .map((skill) => skill.trim())
        .filter(Boolean),
    ),
  ]
}

export function createEmployeeFromSignup(
  input: EmployeeSignupInput,
  existingIds: string[],
): Employee {
  const name = trimField(input.name)
  const now = new Date()
  const joined = now.toLocaleString('en-US', {
    month: 'short',
    year: 'numeric',
  })

  let nextNumber = 2000
  for (const id of existingIds) {
    const match = /^EMP-(\d+)$/.exec(id)
    if (match) {
      nextNumber = Math.max(nextNumber, Number(match[1]) + 1)
    }
  }

  const employee: Employee = {
    id: `EMP-${nextNumber}`,
    name,
    title: trimField(input.title),
    department: trimField(input.department),
    company: 'Northline Collective',
    initials: getInitials(name),
    office: trimField(input.office),
    joined,
    photoUrl: input.photoUrl || portraitPlaceholder,
    email: trimField(input.email),
    phone: trimField(input.phone),
    manager: trimField(input.manager),
    bio: trimField(input.bio),
    skills: parseSkills(input.skills),
  }

  if (input.portraitId) {
    employee.portraitId = input.portraitId
  }

  return employee
}

export function applyEmployeeUpdate(
  existing: Employee,
  input: EmployeeSignupInput,
): Employee {
  const name = trimField(input.name)
  const updated: Employee = {
    ...existing,
    name,
    title: trimField(input.title),
    department: trimField(input.department),
    initials: getInitials(name),
    office: trimField(input.office),
    email: trimField(input.email),
    phone: trimField(input.phone),
    manager: trimField(input.manager),
    bio: trimField(input.bio),
    skills: parseSkills(input.skills),
  }

  if (input.removePortrait) {
    delete updated.portraitId
    updated.photoUrl = portraitPlaceholder
    return updated
  }

  if (input.portraitBlob && input.portraitId) {
    updated.portraitId = input.portraitId
    updated.photoUrl = input.photoUrl || existing.photoUrl
    return updated
  }

  return updated
}
