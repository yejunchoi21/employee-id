import { Link as RouterLink } from 'react-router-dom'
import { Button, Paper, Typography } from '@mui/material'

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
      <Paper role="status" sx={{ p: 4, textAlign: 'center' }}>
        <Typography variant="overline" color="primary" sx={{ display: 'block' }}>
          Empty rack
        </Typography>
        <Typography variant="h2">No employee cards yet</Typography>
        <Typography variant="body2" sx={{ mt: 1, mb: 2, mx: 'auto', maxWidth: 520 }}>
          Add an employee to start the directory, or refresh to load the labeled
          fictional demo profiles. Your saved cards stay in this browser and are
          never overwritten.
        </Typography>
        <Button component={RouterLink} to="/signup" variant="contained">
          Add employee
        </Button>
      </Paper>
    )
  }

  return (
    <Paper role="status" sx={{ p: 4, textAlign: 'center' }}>
      <Typography variant="overline" color="primary" sx={{ display: 'block' }}>
        No matches
      </Typography>
      <Typography variant="h2">No employees found</Typography>
      <Typography variant="body2" sx={{ mt: 1, mb: filtersActive ? 2 : 0, mx: 'auto', maxWidth: 520 }}>
        No matches for that expertise search or department. Try another skill
        keyword, choose a different department, or clear filters.
      </Typography>
      {filtersActive ? (
        <Button type="button" variant="contained" onClick={onClear}>
          Clear filters
        </Button>
      ) : null}
    </Paper>
  )
}

export default DirectoryEmptyState
