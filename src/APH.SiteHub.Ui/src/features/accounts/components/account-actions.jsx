import { Pencil, Trash2 } from 'lucide-react'
import { Button, rowActions } from '@/components/ui'
import { c } from '@/lib/copy'

export function AccountActions({ account, onEdit, onDelete }) {
  return (
    <div className={rowActions}>
      <Button
        variant="ghost"
        size="sm"
        icon
        aria-label={`${c.edit}: ${account.login_name}`}
        onClick={() => onEdit(account)}
      >
        <Pencil size={15} />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        icon
        aria-label={`${c.delete}: ${account.login_name}`}
        onClick={() => onDelete(account)}
      >
        <Trash2 size={15} />
      </Button>
    </div>
  )
}
