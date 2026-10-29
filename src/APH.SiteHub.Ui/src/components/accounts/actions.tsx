'use client'
import { DeleteOutlined, EditOutlined } from '@mui/icons-material'
import { IconButton } from '@mui/material'
import type { Account } from '@/lib/api/types'
import { c } from '@/lib/copy'

export function AccountActions({
  account: a,
  onEdit,
  onDelete,
}: {
  account: Account
  onEdit: (a: Account) => void
  onDelete: (a: Account) => void
}) {
  return (
    <>
      <IconButton aria-label={`${c.edit} ${a.login_name}`} onClick={() => onEdit(a)}>
        <EditOutlined fontSize="small" />
      </IconButton>
      <IconButton aria-label={`${c.delete} ${a.login_name}`} onClick={() => onDelete(a)}>
        <DeleteOutlined fontSize="small" />
      </IconButton>
    </>
  )
}
