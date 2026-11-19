import { useEffect, useState, type FormEvent } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { createEmployeeAccountRequest } from '../api/auth'
import { ApiError } from '../api/client'
import { fetchDepartments } from '../api/helpRequests'
import { useAuth } from '../hooks/useAuth'
import './AdminCreateAccountPage.css'

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
      <main className="admin-accounts">
        <p>Checking your session…</p>
      </main>
    )
  }

  if (!membership) {
    return (
      <main className="admin-accounts">
        <h1>Create employee account</h1>
        <p>Sign in as an admin to provision employee accounts.</p>
      </main>
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

  return (
    <main className="admin-accounts">
      <header className="admin-accounts__hero">
        <div>
          <p className="admin-accounts__eyebrow">Admin</p>
          <h1>Create employee account</h1>
          <p>
            Provision a member login linked to a directory profile. No public
            signup — only admins can create accounts.
          </p>
        </div>
        <Link to="/directory">Back to directory</Link>
      </header>

      <form
        className="admin-accounts__form"
        onSubmit={(event) => {
          void handleSubmit(event)
        }}
      >
        <fieldset disabled={saving || loadingDepartments}>
          <legend>Account</legend>
          <label>
            <span>Work email</span>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
              autoComplete="off"
            />
          </label>
          <label>
            <span>Display name</span>
            <input
              value={displayName}
              onChange={(event) => setDisplayName(event.target.value)}
              required
              maxLength={120}
            />
          </label>
          <label>
            <span>Initial password (temporary)</span>
            <input
              type="password"
              value={initialPassword}
              onChange={(event) => setInitialPassword(event.target.value)}
              required
              minLength={8}
              autoComplete="new-password"
            />
          </label>
        </fieldset>

        <fieldset disabled={saving || loadingDepartments}>
          <legend>Employee profile</legend>
          <label>
            <span>Department</span>
            <select
              value={departmentId}
              onChange={(event) => setDepartmentId(event.target.value)}
              required
            >
              {departments.map((department) => (
                <option key={department.id} value={department.id}>
                  {department.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span>Title</span>
            <input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              required
            />
          </label>
          <label>
            <span>Office</span>
            <input
              value={office}
              onChange={(event) => setOffice(event.target.value)}
              required
            />
          </label>
          <label>
            <span>Joined</span>
            <input
              value={joined}
              onChange={(event) => setJoined(event.target.value)}
              placeholder="Jan 2025"
              required
            />
          </label>
          <label>
            <span>Phone</span>
            <input
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              required
            />
          </label>
          <label>
            <span>Manager</span>
            <input
              value={manager}
              onChange={(event) => setManager(event.target.value)}
              required
            />
          </label>
          <label>
            <span>Bio</span>
            <textarea
              value={bio}
              onChange={(event) => setBio(event.target.value)}
              rows={3}
              required
            />
          </label>
          <label>
            <span>Skills (comma-separated)</span>
            <input
              value={skills}
              onChange={(event) => setSkills(event.target.value)}
              required
            />
          </label>
        </fieldset>

        {error ? (
          <p className="admin-accounts__error" role="alert">
            {error}
          </p>
        ) : null}
        {success ? (
          <p className="admin-accounts__success" role="status">
            {success}
          </p>
        ) : null}

        <button type="submit" disabled={saving || loadingDepartments}>
          {saving ? 'Creating…' : 'Create employee account'}
        </button>
      </form>
    </main>
  )
}

export default AdminCreateAccountPage
