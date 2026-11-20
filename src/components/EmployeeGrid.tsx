import {
  Avatar,
  Box,
  Card,
  CardActionArea,
  CardContent,
  Chip,
  Stack,
  Typography,
} from '@mui/material'
import type { Employee } from '../data/employee'
import { optionalText } from '../utils/displayField'

interface EmployeeGridProps {
  employees: Employee[]
  onViewProfile: (employee: Employee) => void
}

function EmployeeGrid({ employees, onViewProfile }: EmployeeGridProps) {
  return (
    <Box
      component="ul"
      aria-label="Employee grid"
      sx={{
        listStyle: 'none',
        m: 0,
        p: 0,
        display: 'grid',
        gap: 2,
        gridTemplateColumns: {
          xs: '1fr',
          sm: 'repeat(2, minmax(0, 1fr))',
          lg: 'repeat(3, minmax(0, 1fr))',
        },
      }}
    >
      {employees.map((employee) => {
        const askMeAbout = optionalText(employee.askMeAbout)
        return (
          <Box component="li" key={employee.id}>
            <Card sx={{ height: '100%' }}>
              <CardActionArea
                onClick={() => onViewProfile(employee)}
                sx={{ height: '100%', alignItems: 'flex-start' }}
              >
                <CardContent sx={{ display: 'flex', gap: 1.5 }}>
                  <Avatar
                    src={employee.photoUrl}
                    alt=""
                    variant="rounded"
                    sx={{ width: 72, height: 72, flexShrink: 0 }}
                  />
                  <Box sx={{ minWidth: 0 }}>
                    <Stack
                      direction="row"
                      spacing={1}
                      useFlexGap
                      sx={{ alignItems: 'center', flexWrap: 'wrap' }}
                    >
                      <Typography variant="h3" component="h3">
                        {employee.name}
                      </Typography>
                      {employee.isDemo ? (
                        <Chip size="small" variant="outlined" label="Demo" />
                      ) : null}
                    </Stack>
                    <Typography variant="body1">{employee.title}</Typography>
                    <Typography variant="body2">
                      {employee.department}
                      {employee.office ? ` · ${employee.office}` : ''}
                    </Typography>
                    {askMeAbout ? (
                      <Typography variant="body2" sx={{ mt: 0.5 }}>
                        Ask me about: {askMeAbout}
                      </Typography>
                    ) : null}
                    {employee.skills.length > 0 ? (
                      <Stack
                        component="ul"
                        direction="row"
                        spacing={0.5}
                        useFlexGap
                        sx={{ listStyle: 'none', m: 0, mt: 1, p: 0, flexWrap: 'wrap' }}
                      >
                        {employee.skills.slice(0, 4).map((skill) => (
                          <li key={skill}>
                            <Chip size="small" label={skill} />
                          </li>
                        ))}
                      </Stack>
                    ) : null}
                  </Box>
                </CardContent>
              </CardActionArea>
            </Card>
          </Box>
        )
      })}
    </Box>
  )
}

export default EmployeeGrid
