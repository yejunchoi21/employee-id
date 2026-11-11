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
  email: string
  phone: string
  manager: string
  bio: string
  skills: string[]
}

const company = 'Northline Collective'
// Shared placeholder for now — swap per employee when real photos are available.
const photoUrl = portraitPlaceholder

export const employees: Employee[] = [
  {
    id: 'EMP-1042',
    name: 'Jordan Hale',
    title: 'Product Designer',
    department: 'Design',
    company,
    initials: 'JH',
    office: 'Seattle',
    joined: 'Mar 2022',
    photoUrl,
    email: 'jordan.hale@northline.co',
    phone: '+1 (206) 555-0142',
    manager: 'Avery Chen',
    bio: 'Designs clear product experiences for Northline teams, with a focus on accessible interfaces and thoughtful collaboration across engineering and research. Partners with product managers to shape roadmaps, runs design critiques, and documents patterns that keep the experience consistent from first visit through advanced workflows.',
    skills: [
      'User research',
      'Interaction design',
      'Design systems',
      'Accessibility',
      'Figma',
      'Prototyping',
    ],
  },
  {
    id: 'EMP-1043',
    name: 'Samira Okonkwo',
    title: 'Frontend Engineer',
    department: 'Engineering',
    company,
    initials: 'SO',
    office: 'Austin',
    joined: 'Jul 2021',
    photoUrl,
    email: 'samira.okonkwo@northline.co',
    phone: '+1 (512) 555-0188',
    manager: 'Noah Patel',
    bio: 'Builds resilient UI systems and design-token pipelines, helping product squads ship consistent interfaces across web clients.',
    skills: [
      'TypeScript',
      'React',
      'CSS architecture',
      'Design tokens',
      'Testing',
      'Performance',
    ],
  },
  {
    id: 'EMP-1044',
    name: 'Miles Ortega',
    title: 'People Operations Lead',
    department: 'People',
    company,
    initials: 'MO',
    office: 'Chicago',
    joined: 'Jan 2020',
    photoUrl,
    email: 'miles.ortega@northline.co',
    phone: '+1 (312) 555-0164',
    manager: 'Priya Nair',
    bio: 'Supports hiring, onboarding, and internal programs that keep Northline teams connected across offices.',
    skills: [
      'Talent operations',
      'Onboarding',
      'Employee experience',
      'Policy design',
      'Stakeholder management',
    ],
  },
  {
    id: 'EMP-1045',
    name: 'Elena Voss',
    title: 'Data Analyst',
    department: 'Analytics',
    company,
    initials: 'EV',
    office: 'Denver',
    joined: 'Sep 2023',
    photoUrl,
    email: 'elena.voss@northline.co',
    phone: '+1 (303) 555-0191',
    manager: 'Jonah Blake',
    bio: 'Turns product and support metrics into clear reports so leaders can make grounded decisions quickly.',
    skills: [
      'SQL',
      'Dashboarding',
      'Experiment analysis',
      'Data storytelling',
      'Python',
    ],
  },
  {
    id: 'EMP-1046',
    name: 'Chris Nakamura',
    title: 'Customer Success Manager',
    department: 'Customer Success',
    company,
    initials: 'CN',
    office: 'Remote',
    joined: 'May 2021',
    photoUrl,
    email: 'chris.nakamura@northline.co',
    phone: '+1 (415) 555-0117',
    manager: 'Lena Brooks',
    bio: 'Partners with enterprise accounts to plan rollouts, gather feedback, and keep adoption healthy after launch.',
    skills: [
      'Account management',
      'Onboarding programs',
      'Customer research',
      'Renewals',
      'Workshop facilitation',
    ],
  },
  {
    id: 'EMP-1047',
    name: 'Amelia Rhodes',
    title: 'Brand Strategist',
    department: 'Marketing',
    company,
    initials: 'AR',
    office: 'New York',
    joined: 'Nov 2022',
    photoUrl,
    email: 'amelia.rhodes@northline.co',
    phone: '+1 (212) 555-0133',
    manager: 'Theo Martin',
    bio: 'Shapes campaign narratives and visual direction so Northline’s voice stays consistent across channels.',
    skills: [
      'Brand strategy',
      'Campaign planning',
      'Copywriting',
      'Creative direction',
      'Market research',
    ],
  },
  {
    id: 'EMP-1048',
    name: 'Diego Alvarez',
    title: 'Security Engineer',
    department: 'Security',
    company,
    initials: 'DA',
    office: 'Seattle',
    joined: 'Feb 2019',
    photoUrl,
    email: 'diego.alvarez@northline.co',
    phone: '+1 (206) 555-0175',
    manager: 'Harper Quinn',
    bio: 'Hardens internal tools and guides teams through secure development practices without slowing delivery.',
    skills: [
      'Application security',
      'Threat modeling',
      'Secure SDLC',
      'Incident response',
      'Cloud security',
    ],
  },
  {
    id: 'EMP-1049',
    name: 'Priya Shah',
    title: 'Operations Coordinator',
    department: 'Operations',
    company,
    initials: 'PS',
    office: 'Boston',
    joined: 'Aug 2024',
    photoUrl,
    email: 'priya.shah@northline.co',
    phone: '+1 (617) 555-0129',
    manager: 'Miles Ortega',
    bio: 'Keeps cross-team projects organized, from office logistics to launch checklists and vendor coordination.',
    skills: [
      'Project coordination',
      'Vendor management',
      'Process documentation',
      'Event logistics',
      'Cross-team planning',
    ],
  },
]
