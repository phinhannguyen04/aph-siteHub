import { card, cellLink, help, row } from '@/components/ui'
import { cn } from '@/lib/utils'
import { AccountActions } from './account-actions'
import { Status } from './account-status'

export function AccountCards({ accounts, onOpen, onEdit, onDelete }) {
  return (
    <div className="hidden flex-col gap-2 max-[720px]:flex">
      {accounts.map((a) => (
        <article key={a.id} className={cn(card, 'flex flex-col gap-1.5 p-3')}>
          <div className={cn(row, 'justify-between')}>
            <button type="button" className={cellLink} onClick={() => onOpen(a.id)}>
              {a.login_name}
            </button>
            <Status account={a} />
          </div>
          <span className={help}>
            {a.provider} · {a.email}
          </span>
          <AccountActions account={a} onEdit={onEdit} onDelete={onDelete} />
        </article>
      ))}
    </div>
  )
}
