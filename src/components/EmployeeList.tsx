import type { KeyboardEvent } from 'react'
import { Avatar, Box, Chip, Paper, Stack, Typography } from '@mui/material'
import type { Employee } from '../data/employee'
import { optionalText } from '../utils/displayField'

interface EmployeeListProps {
  employees: Employee[]
  onViewProfile: (employee: Employee) => void
}

function EmployeeList({ employees, onViewProfile }: EmployeeListProps) {
  const activate = (employee: Employee) => onViewProfile(employee)

  const onKeyDown = (
    event: KeyboardEvent<HTMLDivElement>,
    employee: Employee,
  ) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      activate(employee)
    }
  }

  return (
    <Stack spacing={1} role="list" aria-label="Employee list">
      {employees.map((employee) => {
        const askMeAbout = optionalText(employee.askMeAbout)
        const timeZone = optionalText(employee.timeZone)

        return (
          <Paper
            key={employee.id}
            role="listitem"
            tabIndex={0}
            onClick={() => activate(employee)}
            onKeyDown={(event) => onKeyDown(event, employee)}
            sx={{
              p: 1.5,
              cursor: 'pointer',
              display: 'flex',
              gap: 1.5,
              alignItems: 'center',
              flexDirection: { xs: 'column', sm: 'row' },
              '&:hover': { borderColor: 'primary.light' },
              '&:focus-visible': {
                outline: '2px solid',
                outlineColor: 'primary.main',
                outlineOffset: 2,
              },
            }}
          >
            <Avatar
              src={employee.photoUrl}
              alt=""
              variant="rounded"
              sx={{ width: 64, height: 64, flexShrink: 0 }}
            />
            <Box sx={{ minWidth: 0, flex: 1, width: '100%' }}>
              <Stack
                direction="row"
                spacing={1}
                sx={{ alignItems: 'center', flexWrap: 'wrap' }}
                useFlexGap
              >
                <Typography variant="h3" component="h3">
                  {employee.name}
                </Typography>
                {employee.isDemo ? (
                  <Chip size="small" variant="outlined" label="Demo profile" />
                ) : null}
              </Stack>
              <Typography variant="body1">{employee.title}</Typography>
              <Typography variant="body2">
                {employee.department}
                {employee.office ? ` · ${employee.office}` : ''}
                {timeZone ? ` · ${timeZone}` : ''}
              </Typography>
              {askMeAbout ? (
                <Typography variant="body2">Ask me about: {askMeAbout}</Typography>
              ) : null}
            </Box>
            <Stack
              spacing={0.5}
              sx={{ alignItems: { xs: 'flex-start', sm: 'flex-end' }, flexShrink: 0 }}
            >
              <Stack
                direction="row"
                spacing={0.5}
                useFlexGap
                sx={{ flexWrap: 'wrap', justifyContent: { sm: 'flex-end' } }}
              >
                {employee.skills.slice(0, 3).map((skill) => (
                  <Chip key={skill} size="small" label={skill} />
                ))}
              </Stack>
              <Typography variant="caption" color="primary">
                Open profile
              </Typography>
            </Stack>
          </Paper>
        )
      })}
    </Stack>
  )
}

export default EmployeeList
