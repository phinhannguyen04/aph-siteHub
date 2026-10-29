'use client'
import { CircularProgress, Stack, Typography } from '@mui/material'
import { c } from '@/lib/copy'
export function Busy() {
  return (
    <Stack role="status" spacing={2} sx={{ ...{ py: 8 }, alignItems: 'center' }}>
      <CircularProgress />
      <Typography>{c.loading}</Typography>
    </Stack>
  )
}
