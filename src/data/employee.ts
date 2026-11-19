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
  /** Optional HTTPS work-chat profile link. */
  chatProfileUrl?: string
  /** Optional IANA-style or friendly time zone label. */
  timeZone?: string
  /** Short “Ask me about…” expertise blurb used in search. */
  askMeAbout?: string
  /** Fictional demo roster entry — never overwrite user-saved cards. */
  isDemo?: boolean
}

const company = 'Northline Collective'
const photoUrl = portraitPlaceholder

/**
 * Clearly labeled fictional demo profiles for an empty directory.
 * Custom cards in localStorage are merged on top and never overwritten.
 */
export const employees: Employee[] = [
  {
    id: 'DEMO-1042',
    name: 'Jordan Hale',
    title: 'Product Designer',
    department: 'Design',
    company,
    initials: 'JH',
    office: 'Seattle',
    joined: 'Mar 2022',
    photoUrl,
    email: 'jordan.hale@northline.example',
    phone: '+1 (206) 555-0142',
    manager: 'Avery Chen',
    bio: 'Designs clear product experiences for Northline teams.',
    skills: ['User research', 'Interaction design', 'Figma', 'Accessibility'],
    timeZone: 'America/Los_Angeles',
    askMeAbout: 'Design systems, onboarding flows, and accessibility reviews',
    chatProfileUrl: 'https://example.com/chat/jordan-hale',
    isDemo: true,
  },
  {
    id: 'DEMO-1043',
    name: 'Samira Okonkwo',
    title: 'Frontend Engineer',
    department: 'Engineering',
    company,
    initials: 'SO',
    office: 'Austin',
    joined: 'Jul 2021',
    photoUrl,
    email: 'samira.okonkwo@northline.example',
    phone: '+1 (512) 555-0188',
    manager: 'Noah Patel',
    bio: 'Builds resilient UI systems across web clients.',
    skills: ['TypeScript', 'React', 'CSS architecture', 'Testing'],
    timeZone: 'America/Chicago',
    askMeAbout: 'React performance, design tokens, and frontend testing',
    chatProfileUrl: 'https://example.com/chat/samira-okonkwo',
    isDemo: true,
  },
  {
    id: 'DEMO-1044',
    name: 'Miles Ortega',
    title: 'People Operations Lead',
    department: 'Human Resources',
    company,
    initials: 'MO',
    office: 'Chicago',
    joined: 'Jan 2020',
    photoUrl,
    email: 'miles.ortega@northline.example',
    phone: '+1 (312) 555-0164',
    manager: 'Priya Nair',
    bio: 'Supports hiring and onboarding across offices.',
    skills: ['Talent operations', 'Onboarding', 'Employee experience'],
    timeZone: 'America/Chicago',
    askMeAbout: 'Hiring loops, onboarding checklists, and team rituals',
    isDemo: true,
  },
  {
    id: 'DEMO-1045',
    name: 'Amelia Rhodes',
    title: 'Brand Strategist',
    department: 'Marketing',
    company,
    initials: 'AR',
    office: 'New York',
    joined: 'Nov 2022',
    photoUrl,
    email: 'amelia.rhodes@northline.example',
    phone: '+1 (212) 555-0133',
    manager: 'Theo Martin',
    bio: 'Shapes campaign narratives across channels.',
    skills: ['Brand strategy', 'Campaign planning', 'Copywriting'],
    timeZone: 'America/New_York',
    askMeAbout: 'Launch messaging, brand voice, and creative briefs',
    chatProfileUrl: 'https://example.com/chat/amelia-rhodes',
    isDemo: true,
  },
  {
    id: 'DEMO-1046',
    name: 'Chris Nakamura',
    title: 'Customer Success Manager',
    department: 'Business',
    company,
    initials: 'CN',
    office: 'Remote',
    joined: 'May 2021',
    photoUrl,
    email: 'chris.nakamura@northline.example',
    phone: '+1 (415) 555-0117',
    manager: 'Lena Brooks',
    bio: 'Partners with enterprise accounts after launch.',
    skills: ['Account management', 'Onboarding programs', 'Renewals'],
    timeZone: 'America/Los_Angeles',
    askMeAbout: 'Customer rollouts, adoption workshops, and renewals',
    isDemo: true,
  },
]

export { portraitPlaceholder }
