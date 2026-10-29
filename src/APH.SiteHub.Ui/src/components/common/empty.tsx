'use client'
import { Box, Typography } from '@mui/material'
import type { ReactNode } from 'react'
export function Empty({
  title,
  body,
  action,
}: {
  title: string
  body: string
  action?: ReactNode
}) {
  return (
    <Box sx={{ py: 8, textAlign: 'center' }}>
      <Typography variant="h6">{title}</Typography>
      <Typography color="text.secondary" sx={{ mt: 1, mb: 3 }}>
        {body}
      </Typography>
      {action}
    </Box>
  )
}
