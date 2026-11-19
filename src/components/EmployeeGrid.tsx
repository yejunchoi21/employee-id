import type { Employee } from '../data/employee'
import { optionalText } from '../utils/displayField'
import './EmployeeGrid.css'

interface EmployeeGridProps {
  employees: Employee[]
  onViewProfile: (employee: Employee) => void
}

function EmployeeGrid({ employees, onViewProfile }: EmployeeGridProps) {
  return (
    <ul className="employee-grid" aria-label="Employee grid">
      {employees.map((employee) => {
        const askMeAbout = optionalText(employee.askMeAbout)
        return (
          <li key={employee.id}>
            <button
              type="button"
              className="employee-grid__card"
              onClick={() => onViewProfile(employee)}
            >
              <img
                className="employee-grid__photo"
                src={employee.photoUrl}
                alt=""
              />
              <div className="employee-grid__body">
                <div className="employee-grid__topline">
                  <h3 className="employee-grid__name">{employee.name}</h3>
                  {employee.isDemo ? (
                    <span className="employee-grid__demo">Demo</span>
                  ) : null}
                </div>
                <p className="employee-grid__title">{employee.title}</p>
                <p className="employee-grid__meta">
                  {employee.department}
                  {employee.office ? ` · ${employee.office}` : ''}
                </p>
                {askMeAbout ? (
                  <p className="employee-grid__ask">Ask me about: {askMeAbout}</p>
                ) : null}
                {employee.skills.length > 0 ? (
                  <ul className="employee-grid__skills">
                    {employee.skills.slice(0, 4).map((skill) => (
                      <li key={skill}>{skill}</li>
                    ))}
                  </ul>
                ) : null}
              </div>
            </button>
          </li>
        )
      })}
    </ul>
  )
}

export default EmployeeGrid
