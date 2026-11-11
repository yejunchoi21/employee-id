import { useEffect, useId, useRef } from 'react'
import type { Employee } from '../data/employee'
import './EmployeeProfileDialog.css'

interface EmployeeProfileDialogProps {
  employee: Employee | null
  onClose: () => void
}

function phoneHref(phone: string) {
  return `tel:${phone.replace(/[^\d+]/g, '')}`
}

function EmployeeProfileDialog({
  employee,
  onClose,
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

    dialog.addEventListener('close', handleClose)
    return () => dialog.removeEventListener('close', handleClose)
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
            </div>
            <button
              ref={closeButtonRef}
              type="button"
              className="employee-profile__close"
              onClick={requestClose}
            >
              Close
            </button>
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

            <dl className="employee-profile__details">
              <div>
                <dt>Work email</dt>
                <dd>
                  <a href={`mailto:${employee.email}`}>{employee.email}</a>
                </dd>
              </div>
              <div>
                <dt>Work phone</dt>
                <dd>
                  <a href={phoneHref(employee.phone)}>{employee.phone}</a>
                </dd>
              </div>
              <div>
                <dt>Office</dt>
                <dd>{employee.office}</dd>
              </div>
              <div>
                <dt>Manager</dt>
                <dd>{employee.manager}</dd>
              </div>
              <div>
                <dt>Joined</dt>
                <dd>{employee.joined}</dd>
              </div>
            </dl>

            <section className="employee-profile__section" aria-label="Biography">
              <h4>Bio</h4>
              <p>{employee.bio}</p>
            </section>

            <section className="employee-profile__section" aria-label="Skills">
              <h4>Skills</h4>
              <ul className="employee-profile__skills">
                {employee.skills.map((skill) => (
                  <li key={skill}>{skill}</li>
                ))}
              </ul>
            </section>
          </div>
        </div>
      ) : null}
    </dialog>
  )
}

export default EmployeeProfileDialog
