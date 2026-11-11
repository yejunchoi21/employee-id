import type { Employee } from '../data/employee'
import './EmployeeCard.css'

interface EmployeeCardProps {
  employee: Employee
}

function EmployeeCard({ employee }: EmployeeCardProps) {
  return (
    <article
      className="employee-card"
      aria-label={`${employee.name} employee ID card`}
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

        <footer className="employee-card__footer">Employee</footer>
      </div>
    </article>
  )
}

export default EmployeeCard
