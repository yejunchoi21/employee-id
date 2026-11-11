import { useId, useState, type MouseEvent } from 'react'
import type { Employee } from '../data/employee'
import './EmployeeCard.css'

interface EmployeeCardProps {
  employee: Employee
  isSelected?: boolean
  isIsolated?: boolean
  onIsolate?: () => void
  onExitIsolate?: () => void
  onViewProfile?: (employee: Employee) => void
}

function EmployeeCard({
  employee,
  isSelected = true,
  isIsolated = false,
  onIsolate,
  onExitIsolate,
  onViewProfile,
}: EmployeeCardProps) {
  const [isFlipped, setIsFlipped] = useState(false)
  const cardId = useId()
  const frontId = `${cardId}-front`
  const backId = `${cardId}-back`

  // Reset to the front face as soon as this card is no longer selected/isolated.
  if ((!isSelected || !isIsolated) && isFlipped) {
    setIsFlipped(false)
  }

  const showFlipped = isSelected && isIsolated && isFlipped
  const showDetails = () => setIsFlipped(true)
  const showFront = () => setIsFlipped(false)

  const handleViewProfile = () => {
    onViewProfile?.(employee)
  }

  const handleCardActivate = () => {
    if (!isSelected) return

    if (!isIsolated) {
      onIsolate?.()
      return
    }

    if (!isFlipped) {
      setIsFlipped(true)
    }
  }

  const handleSceneClick = (event: MouseEvent<HTMLDivElement>) => {
    const target = event.target as HTMLElement
    if (target.closest('button, a, input, textarea, select')) return
    handleCardActivate()
  }

  return (
    <div
      className={`employee-card-scene${isIsolated ? ' is-isolated' : ''}`}
      inert={!isSelected ? true : undefined}
      onClick={handleSceneClick}
    >
      <div
        className={`employee-card-flipper${showFlipped ? ' is-flipped' : ''}`}
      >
        <section
          id={frontId}
          className="employee-card employee-card--front"
          aria-label={`${employee.name} employee ID card`}
          aria-hidden={showFlipped || !isSelected}
          inert={showFlipped || !isSelected ? true : undefined}
        >
          <img
            className="employee-card__bg"
            src={employee.photoUrl}
            alt=""
            aria-hidden="true"
          />

          <header className="employee-card__header">
            <div className="employee-card__logo" aria-hidden="true">
              <span className="employee-card__logo-mark">N</span>
            </div>
            <p className="employee-card__company">{employee.company}</p>
          </header>

          <div className="employee-card__panel">
            <div className="employee-card__identity">
              <h2 className="employee-card__name">{employee.name}</h2>
              <p className="employee-card__title">{employee.title}</p>
            </div>

            <dl className="employee-card__stats">
              <div className="employee-card__stat">
                <dt>Department</dt>
                <dd>{employee.department}</dd>
              </div>
              <div className="employee-card__stat">
                <dt>Employee ID</dt>
                <dd>{employee.id}</dd>
              </div>
              <div className="employee-card__stat">
                <dt>Office</dt>
                <dd>{employee.office}</dd>
              </div>
              <div className="employee-card__stat">
                <dt>Joined</dt>
                <dd>{employee.joined}</dd>
              </div>
            </dl>

            <div className="employee-card__actions employee-card__actions--stack">
              {isIsolated ? (
                <>
                  <button
                    type="button"
                    className="employee-card__button"
                    onClick={showDetails}
                    aria-controls={backId}
                    aria-expanded={showFlipped}
                  >
                    Flip for more info
                  </button>
                  {onExitIsolate ? (
                    <button
                      type="button"
                      className="employee-card__button employee-card__button--secondary"
                      onClick={onExitIsolate}
                    >
                      Back to rack
                    </button>
                  ) : null}
                </>
              ) : (
                <p className="employee-card__hint">Click card to isolate</p>
              )}
            </div>

            <footer className="employee-card__footer">Employee</footer>
          </div>
        </section>

        <section
          id={backId}
          className="employee-card employee-card--back"
          aria-label={`${employee.name} employee details`}
          aria-hidden={!showFlipped}
          inert={!showFlipped ? true : undefined}
        >
          <header className="employee-card__back-header">
            <div className="employee-card__logo" aria-hidden="true">
              <span className="employee-card__logo-mark">N</span>
            </div>
            <p className="employee-card__company">{employee.company}</p>
          </header>

          <div className="employee-card__back-body">
            <div className="employee-card__identity employee-card__identity--back">
              <h2 className="employee-card__name">{employee.name}</h2>
              <p className="employee-card__title">{employee.title}</p>
            </div>

            <dl className="employee-card__details">
              <div className="employee-card__detail">
                <dt>Work email</dt>
                <dd>
                  <a href={`mailto:${employee.email}`}>{employee.email}</a>
                </dd>
              </div>
              <div className="employee-card__detail">
                <dt>Work phone</dt>
                <dd>
                  <a href={`tel:${employee.phone.replace(/[^\d+]/g, '')}`}>
                    {employee.phone}
                  </a>
                </dd>
              </div>
              <div className="employee-card__detail">
                <dt>Office</dt>
                <dd>{employee.office}</dd>
              </div>
              <div className="employee-card__detail">
                <dt>Manager</dt>
                <dd>{employee.manager}</dd>
              </div>
              <div className="employee-card__detail">
                <dt>Joined</dt>
                <dd>{employee.joined}</dd>
              </div>
              <div className="employee-card__detail employee-card__detail--bio">
                <dt>Bio</dt>
                <dd>{employee.bio}</dd>
              </div>
              <div className="employee-card__detail employee-card__detail--skills">
                <dt>Skills</dt>
                <dd>
                  <ul className="employee-card__skills">
                    {employee.skills.map((skill) => (
                      <li key={skill}>{skill}</li>
                    ))}
                  </ul>
                </dd>
              </div>
            </dl>
          </div>

          <div className="employee-card__actions employee-card__actions--back employee-card__actions--stack">
            <button
              type="button"
              className="employee-card__button employee-card__button--secondary"
              onClick={showFront}
              aria-controls={frontId}
              aria-expanded={!showFlipped}
            >
              Flip to front
            </button>
            <button
              type="button"
              className="employee-card__button"
              onClick={handleViewProfile}
            >
              View full profile
            </button>
            {onExitIsolate ? (
              <button
                type="button"
                className="employee-card__button employee-card__button--secondary"
                onClick={onExitIsolate}
              >
                Back to rack
              </button>
            ) : null}
          </div>
        </section>
      </div>
    </div>
  )
}

export default EmployeeCard
