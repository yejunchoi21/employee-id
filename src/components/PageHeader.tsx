import { Box, Stack, Typography } from '@mui/material'
import type { ReactNode } from 'react'

interface PageHeaderProps {
  eyebrow?: string
  title: string
  description?: string
  actions?: ReactNode
  titleRef?: React.Ref<HTMLHeadingElement>
}

function PageHeader({
  eyebrow,
  title,
  description,
  actions,
  titleRef,
}: PageHeaderProps) {
  return (
    <Stack
      direction={{ xs: 'column', sm: 'row' }}
      spacing={1.5}
      sx={{
        mb: 2,
        alignItems: { xs: 'stretch', sm: 'flex-start' },
        justifyContent: 'space-between',
      }}
    >
      <Box sx={{ minWidth: 0, flex: 1 }}>
        {eyebrow ? (
          <Typography
            variant="overline"
            color="primary"
            sx={{ display: 'block', lineHeight: 1.4 }}
          >
            {eyebrow}
          </Typography>
        ) : null}
        <Typography
          ref={titleRef}
          variant="h1"
          component="h1"
          tabIndex={titleRef ? -1 : undefined}
        >
          {title}
        </Typography>
        {description ? (
          <Typography variant="body2" sx={{ mt: 0.5, maxWidth: 640 }}>
            {description}
          </Typography>
        ) : null}
      </Box>
      {actions ? (
        <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap' }}>
          {actions}
        </Stack>
      ) : null}
    </Stack>
  )
}

export default PageHeader
