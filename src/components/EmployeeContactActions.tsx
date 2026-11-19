import { useEffect, useState } from 'react'
import type { Employee } from '../data/employee'
import { getValidHttpsUrl } from '../utils/chatUrl'
import { optionalText } from '../utils/displayField'
import './EmployeeContactActions.css'

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
    <div className="employee-contact">
      <div className="employee-contact__actions">
        {email ? (
          <>
            <a className="employee-contact__button" href={`mailto:${email}`}>
              Email
            </a>
            <button
              type="button"
              className="employee-contact__button employee-contact__button--secondary"
              onClick={() => {
                void handleCopy()
              }}
            >
              Copy email
            </button>
          </>
        ) : null}
        {chatUrl ? (
          <a
            className="employee-contact__button employee-contact__button--secondary"
            href={chatUrl}
            target="_blank"
            rel="noopener noreferrer"
          >
            Open work chat profile
          </a>
        ) : null}
      </div>
      <p className="employee-contact__status" role="status" aria-live="polite">
        {copyStatus === 'success'
          ? 'Email copied.'
          : copyStatus === 'error'
            ? 'Could not copy email. Try again.'
            : ''}
      </p>
    </div>
  )
}

export default EmployeeContactActions
