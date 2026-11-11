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

  const handleSubmit = (input: EmployeeSignupInput) => {
    const result = createEmployee(input)
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
    <main className="directory">
      <h1
        ref={headingRef}
        className="directory__heading"
        tabIndex={-1}
      >
        Create your employee card
      </h1>

      <EmployeeSignupForm onSubmit={handleSubmit} submitLabel="Create my card" />

      <p className="directory__nav">
        Already have a card?{' '}
        <Link className="directory__link" to="/directory">
          Open the directory
        </Link>
      </p>
    </main>
  )
}

export default SignupPage
