import './DirectoryEmptyState.css'

interface DirectoryEmptyStateProps {
  onClear: () => void
}

function DirectoryEmptyState({ onClear }: DirectoryEmptyStateProps) {
  return (
    <div className="directory-empty" role="status">
      <h2 className="directory-empty__title">No employees found</h2>
      <p className="directory-empty__message">
        Try a different search term, choose another department, or clear your
        filters to see everyone again.
      </p>
      <button
        type="button"
        className="directory-empty__clear"
        onClick={onClear}
      >
        Clear filters
      </button>
    </div>
  )
}

export default DirectoryEmptyState
