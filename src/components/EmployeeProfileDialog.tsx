import { useEffect, useId, useRef } from 'react'
import type { Employee } from '../data/employee'
import { optionalText } from '../utils/displayField'
import EmployeeContactActions from './EmployeeContactActions'
import './EmployeeProfileDialog.css'

interface EmployeeProfileDialogProps {
  employee: Employee | null
  canEdit?: boolean
  onClose: () => void
  onEdit?: (employee: Employee) => void
  onDelete?: (employee: Employee) => void
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
    <div>
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  )
}

function EmployeeProfileDialog({
  employee,
  canEdit = false,
  onClose,
  onEdit,
  onDelete,
}: EmployeeProfileDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const closeButtonRef = useRef<HTMLButtonElement>(null)
  const titleId = useId()
  const descriptionId = useId()

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return

    const handleClose = () => {
      document.body.classList.remove('profile-open')
      onClose()
    }

    const handleCancel = (event: Event) => {
      event.preventDefault()
      dialog.close()
    }

    dialog.addEventListener('close', handleClose)
    dialog.addEventListener('cancel', handleCancel)
    return () => {
      dialog.removeEventListener('close', handleClose)
      dialog.removeEventListener('cancel', handleCancel)
    }
  }, [onClose])

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return

    if (employee) {
      if (!dialog.open) {
        dialog.showModal()
      }
      document.body.classList.add('profile-open')
      window.requestAnimationFrame(() => {
        closeButtonRef.current?.focus()
      })
      return
    }

    if (dialog.open) {
      dialog.close()
    }
  }, [employee])

  useEffect(() => {
    return () => {
      document.body.classList.remove('profile-open')
    }
  }, [])

  const requestClose = () => {
    dialogRef.current?.close()
  }

  const phone = optionalText(employee?.phone)
  const office = optionalText(employee?.office)
  const manager = optionalText(employee?.manager)
  const joined = optionalText(employee?.joined)
  const timeZone = optionalText(employee?.timeZone)
  const bio = optionalText(employee?.bio)
  const askMeAbout = optionalText(employee?.askMeAbout)
  const email = optionalText(employee?.email)

  return (
    <dialog
      ref={dialogRef}
      className="employee-profile"
      aria-labelledby={titleId}
      aria-describedby={descriptionId}
      onClick={(event) => {
        if (event.target === dialogRef.current) {
          requestClose()
        }
      }}
    >
      {employee ? (
        <div
          className="employee-profile__sheet"
          onClick={(event) => event.stopPropagation()}
        >
          <header className="employee-profile__header">
            <div>
              <p className="employee-profile__eyebrow">{employee.company}</p>
              <h2 id={titleId} className="employee-profile__title">
                Employee profile
              </h2>
              {employee.isDemo ? (
                <p className="employee-profile__demo-banner">
                  Fictional demo profile for browsing the directory
                </p>
              ) : null}
            </div>
            <div className="employee-profile__header-actions">
              {canEdit ? (
                <>
                  <button
                    type="button"
                    className="employee-profile__edit"
                    onClick={() => {
                      if (!employee) return
                      requestClose()
                      window.requestAnimationFrame(() => onEdit?.(employee))
                    }}
                  >
                    Edit my card
                  </button>
                  <button
                    type="button"
                    className="employee-profile__delete"
                    onClick={() => {
                      if (!employee) return
                      onDelete?.(employee)
                    }}
                  >
                    Delete
                  </button>
                </>
              ) : null}
              <button
                ref={closeButtonRef}
                type="button"
                className="employee-profile__close"
                onClick={requestClose}
              >
                Close
              </button>
            </div>
          </header>

          <div className="employee-profile__content">
            <div className="employee-profile__hero">
              <img
                className="employee-profile__photo"
                src={employee.photoUrl}
                alt={`Portrait of ${employee.name}`}
              />
              <div className="employee-profile__identity">
                <h3 className="employee-profile__name">{employee.name}</h3>
                <p id={descriptionId} className="employee-profile__role">
                  {employee.title}
                </p>
                <p className="employee-profile__meta">
                  {employee.department} · {employee.id}
                </p>
              </div>
            </div>

            <EmployeeContactActions employee={employee} />

            <dl className="employee-profile__details">
              {email ? (
                <div>
                  <dt>Work email</dt>
                  <dd>
                    <a href={`mailto:${email}`}>{email}</a>
                  </dd>
                </div>
              ) : null}
              {phone ? (
                <div>
                  <dt>Work phone</dt>
                  <dd>
                    <a href={phoneHref(phone)}>{phone}</a>
                  </dd>
                </div>
              ) : null}
              <DetailRow label="Office" value={office} />
              <DetailRow label="Time zone" value={timeZone} />
              <DetailRow label="Manager" value={manager} />
              <DetailRow label="Joined" value={joined} />
            </dl>

            {askMeAbout ? (
              <section
                className="employee-profile__section"
                aria-label="Ask me about"
              >
                <h4>Ask me about</h4>
                <p>{askMeAbout}</p>
              </section>
            ) : null}

            {bio ? (
              <section className="employee-profile__section" aria-label="Biography">
                <h4>Bio</h4>
                <p>{bio}</p>
              </section>
            ) : null}

            {employee.skills.length > 0 ? (
              <section className="employee-profile__section" aria-label="Skills">
                <h4>Skills</h4>
                <ul className="employee-profile__skills">
                  {employee.skills.map((skill) => (
                    <li key={skill}>{skill}</li>
                  ))}
                </ul>
              </section>
            ) : null}
          </div>
        </div>
      ) : null}
    </dialog>
  )
}

export default EmployeeProfileDialog
