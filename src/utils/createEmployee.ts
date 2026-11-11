import portraitPlaceholder from '../assets/portrait-placeholder.svg'
import type { Employee } from '../data/employee'

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

  return {
    id: `EMP-${nextNumber}`,
    name,
    title: trimField(input.title),
    department: trimField(input.department),
    company: 'Northline Collective',
    initials: getInitials(name),
    office: trimField(input.office),
    joined,
    photoUrl: portraitPlaceholder,
    email: trimField(input.email),
    phone: trimField(input.phone),
    manager: trimField(input.manager),
    bio: trimField(input.bio),
    skills: parseSkills(input.skills),
  }
}
