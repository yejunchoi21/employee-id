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
  photoUrl: string
}

export const employee: Employee = {
  id: 'EMP-1042',
  name: 'Jordan Hale',
  title: 'Product Designer',
  department: 'Design',
  company: 'Northline Collective',
  initials: 'JH',
  office: 'Seattle',
  joined: 'Mar 2022',
  // Replace this import with a real photo path when available.
  photoUrl: portraitPlaceholder,
}
