/** Default departments every company should have. Names are stable labels; IDs come from Mongo. */
export const DEFAULT_DEPARTMENT_NAMES = [
  'Engineering',
  'Business',
  'Design',
  'Marketing',
  'Human Resources',
] as const

export type DefaultDepartmentName = (typeof DEFAULT_DEPARTMENT_NAMES)[number]
