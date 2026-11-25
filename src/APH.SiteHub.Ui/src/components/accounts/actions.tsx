import { Pencil, Trash2 } from 'lucide-react'
import { Button } from '@/components/common'
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
      <Button
        variant="ghost"
        size="sm"
        square
        aria-label={`${c.edit} ${a.login_name}`}
        onClick={() => onEdit(a)}
      >
        <Pencil size={16} />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        square
        className="text-error"
        aria-label={`${c.delete} ${a.login_name}`}
        onClick={() => onDelete(a)}
      >
        <Trash2 size={16} />
      </Button>
    </div>
  )
}
