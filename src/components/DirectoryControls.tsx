import {
  Box,
  Button,
  MenuItem,
  Paper,
  Stack,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from '@mui/material'
import type { DirectoryViewMode, SortOrder } from '../utils/employeeFilters'

interface DirectoryControlsProps {
  search: string
  department: string
  sort: SortOrder
  view: DirectoryViewMode
  departments: string[]
  resultCount: number
  onSearchChange: (value: string) => void
  onDepartmentChange: (value: string) => void
  onSortChange: (value: SortOrder) => void
  onViewChange: (value: DirectoryViewMode) => void
  onClear: () => void
}

const viewOptions = [
  ['cards', 'Cards'],
  ['grid', 'Grid'],
  ['list', 'List'],
] as const

function DirectoryControls({
  search,
  department,
  sort,
  view,
  departments,
  resultCount,
  onSearchChange,
  onDepartmentChange,
  onSortChange,
  onViewChange,
  onClear,
}: DirectoryControlsProps) {
  const resultLabel =
    resultCount === 1 ? '1 employee found' : `${resultCount} employees found`

  return (
    <Paper component="section" aria-label="Directory filters" sx={{ p: 2, mb: 2 }}>
      <Box
        sx={{
          display: 'grid',
          gap: 2,
          gridTemplateColumns: { xs: '1fr', md: '2fr 1fr 1fr' },
        }}
      >
        <TextField
          id="employee-search"
          type="search"
          label="Search expertise"
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder="Name, title, skills, ask me about…"
          autoComplete="off"
        />

        <TextField
          select
          id="employee-department"
          label="Department"
          value={department}
          onChange={(event) => onDepartmentChange(event.target.value)}
        >
          <MenuItem value="all">All departments</MenuItem>
          {departments.map((name) => (
            <MenuItem key={name} value={name}>
              {name}
            </MenuItem>
          ))}
        </TextField>

        <TextField
          select
          id="employee-sort"
          label="Sort"
          value={sort}
          onChange={(event) => onSortChange(event.target.value as SortOrder)}
        >
          <MenuItem value="asc">Name A–Z</MenuItem>
          <MenuItem value="desc">Name Z–A</MenuItem>
        </TextField>
      </Box>

      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        spacing={1.5}
        sx={{
          mt: 2,
          alignItems: { xs: 'stretch', sm: 'center' },
          justifyContent: 'space-between',
        }}
      >
        <Typography variant="body2" aria-live="polite">
          {resultLabel}
        </Typography>

        <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
          <ToggleButtonGroup
            exclusive
            size="small"
            value={view}
            aria-label="Directory view"
            onChange={(_, next: DirectoryViewMode | null) => {
              if (next) onViewChange(next)
            }}
          >
            {viewOptions.map(([value, label]) => (
              <ToggleButton
                key={value}
                value={value}
                aria-pressed={view === value}
                sx={{ textTransform: 'none', px: 1.75 }}
              >
                {label}
              </ToggleButton>
            ))}
          </ToggleButtonGroup>

          <Button type="button" variant="outlined" size="small" onClick={onClear}>
            Clear filters
          </Button>
        </Stack>
      </Stack>
    </Paper>
  )
}

export default DirectoryControls
