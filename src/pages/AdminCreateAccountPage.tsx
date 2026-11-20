import { useEffect, useState, type FormEvent } from 'react'
import { Link as RouterLink, Navigate } from 'react-router-dom'
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import { createEmployeeAccountRequest } from '../api/auth'
import { ApiError } from '../api/client'
import { fetchDepartments } from '../api/helpRequests'
import PageHeader from '../components/PageHeader'
import { useAuth } from '../hooks/useAuth'

interface DepartmentOption {
  id: string
  name: string
}

function AdminCreateAccountPage() {
  const { membership, isAuthLoading, refreshPublishedEmployees } = useAuth()
  const [departments, setDepartments] = useState<DepartmentOption[]>([])
  const [loadingDepartments, setLoadingDepartments] = useState(false)
  const [email, setEmail] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [initialPassword, setInitialPassword] = useState('')
  const [departmentId, setDepartmentId] = useState('')
  const [title, setTitle] = useState('')
  const [office, setOffice] = useState('')
  const [joined, setJoined] = useState('')
  const [phone, setPhone] = useState('')
  const [manager, setManager] = useState('')
  const [bio, setBio] = useState('')
  const [skills, setSkills] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!membership || membership.role !== 'admin' || membership.mustChangePassword) {
      return
    }

    let cancelled = false
    async function loadDepartments() {
      setLoadingDepartments(true)
      try {
        const result = await fetchDepartments()
        if (cancelled) return
        setDepartments(result.departments)
        setDepartmentId((current) => current || result.departments[0]?.id || '')
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof ApiError
              ? err.message
              : 'Could not load departments.',
          )
        }
      } finally {
        if (!cancelled) setLoadingDepartments(false)
      }
    }

    void loadDepartments()
    return () => {
      cancelled = true
    }
  }, [membership])

  if (isAuthLoading) {
    return (
      <Box component="main">
        <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
          <CircularProgress size={18} />
          <Typography variant="body2">Checking your session…</Typography>
        </Stack>
      </Box>
    )
  }

  if (!membership) {
    return (
      <Box component="main">
        <PageHeader
          title="Create employee account"
          description="Sign in as an admin to provision employee accounts."
        />
      </Box>
    )
  }

  if (membership.role !== 'admin') {
    return <Navigate to="/directory" replace />
  }

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    if (saving) return

    setSaving(true)
    setError(null)
    setSuccess(null)
    try {
      const result = await createEmployeeAccountRequest({
        email,
        displayName,
        initialPassword,
        departmentId,
        title,
        office,
        joined,
        phone,
        manager,
        bio,
        skills,
      })
      setSuccess(
        result.linkedExistingProfile
          ? `Linked account for ${result.membership.email} to the existing profile ${result.employee.employeeCode}. They must change the temporary password on first login.`
          : `Created account + profile for ${result.membership.email} (${result.employee.employeeCode}). They must change the temporary password on first login.`,
      )
      setEmail('')
      setDisplayName('')
      setInitialPassword('')
      setTitle('')
      setOffice('')
      setJoined('')
      setPhone('')
      setManager('')
      setBio('')
      setSkills('')
      await refreshPublishedEmployees()
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : 'Could not create the employee account.',
      )
    } finally {
      setSaving(false)
    }
  }

  const busy = saving || loadingDepartments

  return (
    <Box component="main">
      <PageHeader
        eyebrow="Admin"
        title="Create employee account"
        description="Provision a member login linked to a directory profile. No public signup — only admins can create accounts."
        actions={
          <Button component={RouterLink} to="/directory" variant="outlined">
            Back to directory
          </Button>
        }
      />

      <Stack
        component="form"
        spacing={2}
        onSubmit={(event) => {
          void handleSubmit(event)
        }}
        sx={{ maxWidth: 640 }}
      >
        <Paper sx={{ p: 2 }}>
          <Stack
            component="fieldset"
            spacing={2}
            disabled={busy}
            sx={{ border: 0, m: 0, p: 0, minWidth: 0 }}
          >
            <Typography variant="subtitle1" component="legend" sx={{ p: 0, mb: 1.5 }}>
              Account
            </Typography>
            <TextField
              label="Work email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
              autoComplete="off"
            />
            <TextField
              label="Display name"
              value={displayName}
              onChange={(event) => setDisplayName(event.target.value)}
              required
              slotProps={{ htmlInput: { maxLength: 120 } }}
            />
            <TextField
              label="Initial password (temporary)"
              type="password"
              value={initialPassword}
              onChange={(event) => setInitialPassword(event.target.value)}
              required
              autoComplete="new-password"
              slotProps={{ htmlInput: { minLength: 8 } }}
            />
          </Stack>
        </Paper>

        <Paper sx={{ p: 2 }}>
          <Stack
            component="fieldset"
            spacing={2}
            disabled={busy}
            sx={{ border: 0, m: 0, p: 0, minWidth: 0 }}
          >
            <Typography variant="subtitle1" component="legend" sx={{ p: 0, mb: 1.5 }}>
              Employee profile
            </Typography>
            <TextField
              select
              label="Department"
              value={departmentId}
              onChange={(event) => setDepartmentId(event.target.value)}
              required
            >
              {departments.map((department) => (
                <MenuItem key={department.id} value={department.id}>
                  {department.name}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              label="Title"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              required
            />
            <TextField
              label="Office"
              value={office}
              onChange={(event) => setOffice(event.target.value)}
              required
            />
            <TextField
              label="Joined"
              value={joined}
              onChange={(event) => setJoined(event.target.value)}
              placeholder="Jan 2025"
              required
            />
            <TextField
              label="Phone"
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              required
            />
            <TextField
              label="Manager"
              value={manager}
              onChange={(event) => setManager(event.target.value)}
              required
            />
            <TextField
              label="Bio"
              value={bio}
              onChange={(event) => setBio(event.target.value)}
              multiline
              minRows={3}
              required
            />
            <TextField
              label="Skills (comma-separated)"
              value={skills}
              onChange={(event) => setSkills(event.target.value)}
              required
            />
          </Stack>
        </Paper>

        {error ? <Alert severity="error">{error}</Alert> : null}
        {success ? <Alert severity="success">{success}</Alert> : null}

        <Box>
          <Button type="submit" variant="contained" disabled={busy}>
            {saving ? 'Creating…' : 'Create employee account'}
          </Button>
        </Box>
      </Stack>
    </Box>
  )
}

export default AdminCreateAccountPage
