import type { KeyboardEvent } from 'react'
import type { Employee } from '../data/employee'
import { optionalText } from '../utils/displayField'
import './EmployeeList.css'

interface EmployeeListProps {
  employees: Employee[]
  onViewProfile: (employee: Employee) => void
}

function EmployeeList({ employees, onViewProfile }: EmployeeListProps) {
  const activate = (employee: Employee) => onViewProfile(employee)

  const onKeyDown = (
    event: KeyboardEvent<HTMLDivElement>,
    employee: Employee,
  ) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      activate(employee)
    }
  }

  return (
    <div className="employee-list" role="list" aria-label="Employee list">
      {employees.map((employee) => {
        const askMeAbout = optionalText(employee.askMeAbout)
        const timeZone = optionalText(employee.timeZone)

        return (
          <div
            key={employee.id}
            className="employee-list__row"
            role="listitem"
            tabIndex={0}
            onClick={() => activate(employee)}
            onKeyDown={(event) => onKeyDown(event, employee)}
          >
            <img
              className="employee-list__photo"
              src={employee.photoUrl}
              alt=""
            />
            <div className="employee-list__main">
              <div className="employee-list__topline">
                <h3 className="employee-list__name">{employee.name}</h3>
                {employee.isDemo ? (
                  <span className="employee-list__demo">Demo profile</span>
                ) : null}
              </div>
              <p className="employee-list__title">{employee.title}</p>
              <p className="employee-list__meta">
                {employee.department}
                {employee.office ? ` · ${employee.office}` : ''}
                {timeZone ? ` · ${timeZone}` : ''}
              </p>
              {askMeAbout ? (
                <p className="employee-list__ask">Ask me about: {askMeAbout}</p>
              ) : null}
            </div>
            <div className="employee-list__side">
              {employee.skills.slice(0, 3).map((skill) => (
                <span key={skill} className="employee-list__skill">
                  {skill}
                </span>
              ))}
              <span className="employee-list__hint">Open profile</span>
            </div>
          </div>
        )
      })}
    </div>
  )
}

export default EmployeeList
