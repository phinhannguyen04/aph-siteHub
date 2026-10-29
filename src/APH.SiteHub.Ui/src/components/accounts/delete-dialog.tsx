'use client'
import { TextField, Typography } from '@mui/material'
import { useState } from 'react'
import { Confirm, ErrorBox } from '@/components/common'
import { useWrite } from '@/lib/api/hooks'
import type { Account } from '@/lib/api/types'
import { c } from '@/lib/copy'

export function DeleteAccountDialog({
  account,
  onClose,
  onDeleted,
}: {
  account: Account
  onClose: () => void
  onDeleted: () => void
}) {
  const [confirmation, setConfirmation] = useState('')
  const write = useWrite(['accounts', 'stats', 'account'])
  return (
    <Confirm
      title={c.deleteAccount}
      pending={write.pending}
      disabled={confirmation !== account.login_name}
      onClose={onClose}
      onConfirm={() =>
        void write.run(`/api/accounts/${account.id}`, 'DELETE', undefined, onDeleted)
      }
    >
      <Typography>{c.irreversible}</Typography>
      <Typography sx={{ fontWeight: 700 }}>{account.login_name}</Typography>
      <TextField
        autoFocus
        label={c.confirmLogin}
        value={confirmation}
        onChange={(e) => setConfirmation(e.target.value)}
      />
      <ErrorBox error={write.error} />
    </Confirm>
  )
}
