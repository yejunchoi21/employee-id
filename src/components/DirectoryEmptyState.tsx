import { Link } from 'react-router-dom'
import './DirectoryEmptyState.css'

interface DirectoryEmptyStateProps {
  onClear: () => void
  hasAnyEmployees?: boolean
  filtersActive?: boolean
}

function DirectoryEmptyState({
  onClear,
  hasAnyEmployees = false,
  filtersActive = false,
}: DirectoryEmptyStateProps) {
  if (!hasAnyEmployees) {
    return (
      <div className="directory-empty" role="status">
        <p className="directory-empty__eyebrow">Empty rack</p>
        <h2 className="directory-empty__title">No employee cards yet</h2>
        <p className="directory-empty__message">
          Create the first badge to start the Northline coat rack. Portraits and
          details stay in this browser.
        </p>
        <Link className="directory-empty__clear" to="/signup">
          Add employee
        </Link>
      </div>
    )
  }

  return (
    <div className="directory-empty" role="status">
      <p className="directory-empty__eyebrow">No matches</p>
      <h2 className="directory-empty__title">No employees found</h2>
      <p className="directory-empty__message">
        Try a different search term, choose another department, or clear your
        filters to see everyone again.
      </p>
      {filtersActive ? (
        <button
          type="button"
          className="directory-empty__clear"
          onClick={onClear}
        >
          Clear filters
        </button>
      ) : null}
    </div>
  )
}

export default DirectoryEmptyState
