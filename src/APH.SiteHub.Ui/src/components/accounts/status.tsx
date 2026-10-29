'use client'
import { Chip } from '@mui/material'
import type { Account } from '@/lib/api/types'
import { c } from '@/lib/copy'

export function Status({ account }: { account: Account }) {
  return (
    <Chip
      size="small"
      variant="outlined"
      color={account.is_limit ? 'warning' : 'success'}
      label={account.is_limit ? c.limited : c.unlimited}
    />
  )
}
