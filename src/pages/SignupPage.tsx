import { useEffect, useRef } from 'react'
import { Link as RouterLink, useNavigate } from 'react-router-dom'
import { Box, Link, Typography } from '@mui/material'
import EmployeeSignupForm from '../components/EmployeeSignupForm'
import PageHeader from '../components/PageHeader'
import { useEmployeeDirectory } from '../hooks/useEmployeeDirectory'
import type { EmployeeSignupInput } from '../utils/createEmployee'

function SignupPage() {
  const navigate = useNavigate()
  const headingRef = useRef<HTMLHeadingElement>(null)
  const { createEmployee } = useEmployeeDirectory()

  useEffect(() => {
    headingRef.current?.focus()
  }, [])

  const handleSubmit = async (input: EmployeeSignupInput) => {
    const result = await createEmployee(input)
    if (!result.ok) {
      return result
    }

    navigate('/directory', {
      replace: false,
      state: { focusEmployeeId: result.employee.id },
    })

    return { ok: true as const }
  }

  return (
    <Box component="main">
      <PageHeader
        eyebrow="New hire badge"
        title="Create your employee card"
        description="Fill in your details, upload a portrait, and drop your badge onto the Northline rack."
        titleRef={headingRef}
      />

      <EmployeeSignupForm onSubmit={handleSubmit} submitLabel="Create my card" />

      <Typography variant="body2" sx={{ mt: 2 }}>
        Already on the roster?{' '}
        <Link component={RouterLink} to="/directory">
          Open the directory
        </Link>
      </Typography>
    </Box>
  )
}

export default SignupPage
