import type { SortOrder } from '../utils/employeeFilters'
import './DirectoryControls.css'

interface DirectoryControlsProps {
  search: string
  department: string
  sort: SortOrder
  departments: string[]
  resultCount: number
  onSearchChange: (value: string) => void
  onDepartmentChange: (value: string) => void
  onSortChange: (value: SortOrder) => void
  onClear: () => void
}

function DirectoryControls({
  search,
  department,
  sort,
  departments,
  resultCount,
  onSearchChange,
  onDepartmentChange,
  onSortChange,
  onClear,
}: DirectoryControlsProps) {
  const resultLabel =
    resultCount === 1 ? '1 employee found' : `${resultCount} employees found`

  return (
    <section className="directory-controls" aria-label="Directory filters">
      <div className="directory-controls__fields">
        <div className="directory-controls__field directory-controls__field--search">
          <label htmlFor="employee-search">Search</label>
          <input
            id="employee-search"
            type="search"
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Search employees…"
            autoComplete="off"
          />
        </div>

        <div className="directory-controls__field">
          <label htmlFor="employee-department">Department</label>
          <select
            id="employee-department"
            value={department}
            onChange={(event) => onDepartmentChange(event.target.value)}
          >
            <option value="all">All departments</option>
            {departments.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
        </div>

        <div className="directory-controls__field">
          <label htmlFor="employee-sort">Sort</label>
          <select
            id="employee-sort"
            value={sort}
            onChange={(event) =>
              onSortChange(event.target.value as SortOrder)
            }
          >
            <option value="asc">Name A–Z</option>
            <option value="desc">Name Z–A</option>
          </select>
        </div>
      </div>

      <div className="directory-controls__meta">
        <p className="directory-controls__count" aria-live="polite">
          {resultLabel}
        </p>
        <button
          type="button"
          className="directory-controls__clear"
          onClick={onClear}
        >
          Clear filters
        </button>
      </div>
    </section>
  )
}

export default DirectoryControls
