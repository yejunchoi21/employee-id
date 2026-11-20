import { useEffect, useState } from 'react'
import { Box, Button, Stack, Typography } from '@mui/material'
import type { Employee } from '../data/employee'
import { getValidHttpsUrl } from '../utils/chatUrl'
import { optionalText } from '../utils/displayField'

interface EmployeeContactActionsProps {
  employee: Employee
}

function EmployeeContactActions({ employee }: EmployeeContactActionsProps) {
  const email = optionalText(employee.email)
  const chatUrl = getValidHttpsUrl(employee.chatProfileUrl)
  const [copyStatus, setCopyStatus] = useState<'idle' | 'success' | 'error'>(
    'idle',
  )

  useEffect(() => {
    if (copyStatus === 'idle') return
    const timer = window.setTimeout(() => setCopyStatus('idle'), 2200)
    return () => window.clearTimeout(timer)
  }, [copyStatus])

  if (!email && !chatUrl) return null

  const handleCopy = async () => {
    if (!email) return
    try {
      await navigator.clipboard.writeText(email)
      setCopyStatus('success')
    } catch {
      setCopyStatus('error')
    }
  }

  return (
    <Box>
      <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: 'wrap' }}>
        {email ? (
          <>
            <Button
              component="a"
              href={`mailto:${email}`}
              variant="contained"
              size="small"
            >
              Email
            </Button>
            <Button
              type="button"
              variant="outlined"
              size="small"
              onClick={() => {
                void handleCopy()
              }}
            >
              Copy email
            </Button>
          </>
        ) : null}
        {chatUrl ? (
          <Button
            component="a"
            href={chatUrl}
            target="_blank"
            rel="noopener noreferrer"
            variant="outlined"
            size="small"
          >
            Open work chat profile
          </Button>
        ) : null}
      </Stack>
      <Typography
        variant="caption"
        color={copyStatus === 'error' ? 'error' : 'text.secondary'}
        role="status"
        aria-live="polite"
        sx={{ display: 'block', minHeight: '1.5em', mt: 0.5 }}
      >
        {copyStatus === 'success'
          ? 'Email copied.'
          : copyStatus === 'error'
            ? 'Could not copy email. Try again.'
            : ''}
      </Typography>
    </Box>
  )
}

export default EmployeeContactActions
