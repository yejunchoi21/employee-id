import Chip from '@mui/material/Chip'

const toneByStatus: Record<
  string,
  'default' | 'primary' | 'success' | 'warning' | 'error' | 'info'
> = {
  open: 'info',
  pending: 'info',
  available: 'info',
  accepted: 'success',
  approved: 'success',
  fulfilled: 'success',
  resolved: 'success',
  assigned: 'success',
  maintenance: 'warning',
  declined: 'error',
  cancelled: 'error',
  retired: 'error',
  inactive: 'default',
}

interface StatusChipProps {
  status: string
  label?: string
  size?: 'small' | 'medium'
}

function StatusChip({ status, label, size = 'small' }: StatusChipProps) {
  const key = status.toLowerCase()
  return (
    <Chip
      size={size}
      label={label ?? status}
      color={toneByStatus[key] ?? 'default'}
      variant="filled"
      sx={{ textTransform: 'capitalize' }}
    />
  )
}

export default StatusChip
