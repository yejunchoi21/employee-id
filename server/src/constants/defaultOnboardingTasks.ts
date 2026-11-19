export const taskResponsibleRoles = ['new_hire', 'manager'] as const
export type TaskResponsibleRole = (typeof taskResponsibleRoles)[number]

export interface DefaultOnboardingTask {
  title: string
  instructions: string
  responsible: TaskResponsibleRole
  /** Days after start date for the initial due date. */
  dueOffsetDays: number
}

/**
 * Reusable template copied into each plan at creation time.
 * Editing a plan's tasks never mutates this list.
 */
export const defaultOnboardingTasks: DefaultOnboardingTask[] = [
  {
    title: 'Set up work accounts',
    instructions:
      'Confirm email, chat, and any required internal tools are working.',
    responsible: 'manager',
    dueOffsetDays: 1,
  },
  {
    title: 'Review company policies',
    instructions: 'Read the handbook sections linked by People Ops.',
    responsible: 'new_hire',
    dueOffsetDays: 3,
  },
  {
    title: 'Complete introductory training',
    instructions: 'Finish the starter training modules for your role.',
    responsible: 'new_hire',
    dueOffsetDays: 7,
  },
  {
    title: 'Meet your buddy',
    instructions: 'Schedule an intro chat with your assigned buddy.',
    responsible: 'new_hire',
    dueOffsetDays: 5,
  },
  {
    title: 'Meet your team',
    instructions: 'Join a team standup or schedule intro meetings.',
    responsible: 'manager',
    dueOffsetDays: 10,
  },
]
