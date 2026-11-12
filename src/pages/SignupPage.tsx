import { useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import EmployeeSignupForm from '../components/EmployeeSignupForm'
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
    <main className="page">
      <div className="page__hero">
        <p className="page__kicker">New hire badge</p>
        <h1 ref={headingRef} className="page__heading" tabIndex={-1}>
          Create your employee card
        </h1>
        <p className="page__lede">
          Fill in your details, upload a portrait, and drop your badge onto the
          Northline rack.
        </p>
      </div>

      <EmployeeSignupForm onSubmit={handleSubmit} submitLabel="Create my card" />

      <p className="page__footer-note">
        Already on the roster?{' '}
        <Link to="/directory">Open the directory</Link>
      </p>
    </main>
  )
}

export default SignupPage
