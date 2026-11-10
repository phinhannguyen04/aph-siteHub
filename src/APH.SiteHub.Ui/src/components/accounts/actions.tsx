'use client'
import { Pencil, Trash2 } from 'lucide-react'
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
    <div className="flex">
      <button
        type="button"
        className="btn btn-ghost btn-sm btn-square"
        aria-label={`${c.edit} ${a.login_name}`}
        onClick={() => onEdit(a)}
      >
        <Pencil size={16} />
      </button>
      <button
        type="button"
        className="btn btn-ghost btn-sm btn-square text-error"
        aria-label={`${c.delete} ${a.login_name}`}
        onClick={() => onDelete(a)}
      >
        <Trash2 size={16} />
      </button>
    </div>
  )
}
