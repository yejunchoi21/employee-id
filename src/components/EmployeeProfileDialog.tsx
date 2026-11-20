import { useId, type ReactNode } from 'react'
import {
  Alert,
  Avatar,
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Link,
  Stack,
  Typography,
} from '@mui/material'
import type { Employee } from '../data/employee'
import { optionalText } from '../utils/displayField'
import EmployeeContactActions from './EmployeeContactActions'

interface EmployeeProfileDialogProps {
  employee: Employee | null
  canEdit?: boolean
  canRequestHelp?: boolean
  onClose: () => void
  onEdit?: (employee: Employee) => void
  onDelete?: (employee: Employee) => void
  onRequestHelp?: (employee: Employee) => void
}

function phoneHref(phone: string) {
  return `tel:${phone.replace(/[^\d+]/g, '')}`
}

function DetailRow({
  label,
  value,
}: {
  label: string
  value: string | null
}) {
  if (!value) return null
  return (
    <Box>
      <Typography variant="overline" color="text.secondary" component="dt">
        {label}
      </Typography>
      <Typography variant="body1" component="dd" sx={{ m: 0 }}>
        {value}
      </Typography>
    </Box>
  )
}

function ProfileSection({
  label,
  heading,
  children,
}: {
  label: string
  heading: string
  children: ReactNode
}) {
  return (
    <Box component="section" aria-label={label}>
      <Typography variant="h4" component="h4" sx={{ mb: 0.5 }}>
        {heading}
      </Typography>
      {children}
    </Box>
  )
}

function EmployeeProfileDialog({
  employee,
  canEdit = false,
  canRequestHelp = false,
  onClose,
  onEdit,
  onDelete,
  onRequestHelp,
}: EmployeeProfileDialogProps) {
  const titleId = useId()
  const descriptionId = useId()

  const phone = optionalText(employee?.phone)
  const office = optionalText(employee?.office)
  const manager = optionalText(employee?.manager)
  const joined = optionalText(employee?.joined)
  const timeZone = optionalText(employee?.timeZone)
  const bio = optionalText(employee?.bio)
  const askMeAbout = optionalText(employee?.askMeAbout)
  const email = optionalText(employee?.email)

  return (
    <Dialog
      open={Boolean(employee)}
      onClose={onClose}
      scroll="paper"
      fullWidth
      maxWidth="sm"
      aria-labelledby={titleId}
      aria-describedby={descriptionId}
      transitionDuration={{ enter: 150, exit: 0 }}
    >
      {employee ? (
        <>
          <DialogTitle component="div" sx={{ pb: 1 }}>
            <Typography variant="overline" color="primary" sx={{ display: 'block' }}>
              {employee.company}
            </Typography>
            <Typography variant="h2" id={titleId}>
              Employee profile
            </Typography>
            {employee.isDemo ? (
              <Alert severity="info" sx={{ mt: 1 }}>
                Fictional demo profile for browsing the directory
              </Alert>
            ) : null}
          </DialogTitle>

          <DialogContent dividers>
            <Stack spacing={2}>
              <Stack direction="row" spacing={2} sx={{ alignItems: 'center' }}>
                <Avatar
                  variant="rounded"
                  src={employee.photoUrl}
                  alt={`Portrait of ${employee.name}`}
                  sx={{ width: 96, height: 96, flexShrink: 0 }}
                />
                <Box sx={{ minWidth: 0 }}>
                  <Typography variant="h3" component="h3">
                    {employee.name}
                  </Typography>
                  <Typography variant="body1" id={descriptionId}>
                    {employee.title}
                  </Typography>
                  <Typography variant="body2">
                    {employee.department} · {employee.id}
                  </Typography>
                </Box>
              </Stack>

              <EmployeeContactActions employee={employee} />

              <Box
                component="dl"
                sx={{
                  m: 0,
                  display: 'grid',
                  gap: 1.5,
                  gridTemplateColumns: {
                    xs: '1fr',
                    sm: 'repeat(2, minmax(0, 1fr))',
                  },
                }}
              >
                {email ? (
                  <Box>
                    <Typography variant="overline" color="text.secondary" component="dt">
                      Work email
                    </Typography>
                    <Typography variant="body1" component="dd" sx={{ m: 0 }}>
                      <Link href={`mailto:${email}`}>{email}</Link>
                    </Typography>
                  </Box>
                ) : null}
                {phone ? (
                  <Box>
                    <Typography variant="overline" color="text.secondary" component="dt">
                      Work phone
                    </Typography>
                    <Typography variant="body1" component="dd" sx={{ m: 0 }}>
                      <Link href={phoneHref(phone)}>{phone}</Link>
                    </Typography>
                  </Box>
                ) : null}
                <DetailRow label="Office" value={office} />
                <DetailRow label="Time zone" value={timeZone} />
                <DetailRow label="Manager" value={manager} />
                <DetailRow label="Joined" value={joined} />
              </Box>

              {askMeAbout ? (
                <ProfileSection label="Ask me about" heading="Ask me about">
                  <Typography variant="body1">{askMeAbout}</Typography>
                </ProfileSection>
              ) : null}

              {bio ? (
                <ProfileSection label="Biography" heading="Bio">
                  <Typography variant="body1">{bio}</Typography>
                </ProfileSection>
              ) : null}

              {employee.skills.length > 0 ? (
                <ProfileSection label="Skills" heading="Skills">
                  <Stack
                    component="ul"
                    direction="row"
                    spacing={0.5}
                    useFlexGap
                    sx={{ listStyle: 'none', m: 0, p: 0, flexWrap: 'wrap' }}
                  >
                    {employee.skills.map((skill) => (
                      <li key={skill}>
                        <Chip size="small" label={skill} />
                      </li>
                    ))}
                  </Stack>
                </ProfileSection>
              ) : null}
            </Stack>
          </DialogContent>

          <DialogActions sx={{ px: 3, py: 1.5, flexWrap: 'wrap', gap: 1 }}>
            {canRequestHelp ? (
              <Button
                type="button"
                variant="contained"
                onClick={() => onRequestHelp?.(employee)}
              >
                Request help
              </Button>
            ) : null}
            {canEdit ? (
              <>
                <Button
                  type="button"
                  variant="outlined"
                  onClick={() => {
                    onClose()
                    window.requestAnimationFrame(() => onEdit?.(employee))
                  }}
                >
                  Edit my card
                </Button>
                <Button
                  type="button"
                  variant="outlined"
                  color="error"
                  onClick={() => onDelete?.(employee)}
                >
                  Delete
                </Button>
              </>
            ) : null}
            <Button type="button" onClick={onClose} autoFocus>
              Close
            </Button>
          </DialogActions>
        </>
      ) : null}
    </Dialog>
  )
}

export default EmployeeProfileDialog
