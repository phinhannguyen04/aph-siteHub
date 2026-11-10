'use client'
import { useState } from 'react'
import { Confirm, ErrorBox, Field } from '@/components/common'
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
      <p className="text-base-content/80">{c.irreversible}</p>
      <p className="rounded-field bg-base-200 px-3 py-2 font-mono font-semibold">
        {account.login_name}
      </p>
      <Field
        autoFocus
        label={c.confirmLogin}
        autoComplete="off"
        value={confirmation}
        onChange={(e) => setConfirmation(e.target.value)}
      />
      <ErrorBox error={write.error} />
    </Confirm>
  )
}
