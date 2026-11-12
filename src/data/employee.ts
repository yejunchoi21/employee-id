import portraitPlaceholder from '../assets/portrait-placeholder.svg'

export interface Employee {
  id: string
  name: string
  title: string
  department: string
  company: string
  initials: string
  office: string
  joined: string
  /** Runtime display URL (placeholder or object URL). Not for large base64 storage. */
  photoUrl: string
  /** IndexedDB key for a custom uploaded portrait, if any. */
  portraitId?: string
  email: string
  phone: string
  manager: string
  bio: string
  skills: string[]
}

/** Seed directory starts empty — add people via signup. */
export const employees: Employee[] = []

export { portraitPlaceholder }
