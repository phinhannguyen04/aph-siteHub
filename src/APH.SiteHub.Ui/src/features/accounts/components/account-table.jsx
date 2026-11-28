import { ArrowDown, ArrowUp } from 'lucide-react'
import { card, cellLink, localDate } from '@/components/ui'
import { c } from '@/lib/copy'
import { cn } from '@/lib/utils'
import { AccountActions } from './account-actions'
import { Status } from './account-status'

const th =
  'border-b border-border bg-secondary px-3 py-2 text-left text-xs font-semibold tracking-[0.05em] whitespace-nowrap text-subtle uppercase'
const td = 'border-b border-border px-3 py-2 whitespace-nowrap group-last/row:border-b-0'

const columns = [
  ['provider', c.provider],
  ['login_name', c.loginName],
  ['email', c.email],
  ['external_account_id', c.externalId],
  ['is_limit', c.status],
  ['created_at', c.createdAt],
]

export function AccountTable({ accounts, sort, asc, onSort, onOpen, onEdit, onDelete }) {
  return (
    <div className={cn(card, 'overflow-x-auto max-[720px]:hidden')}>
      <table className="w-full border-collapse">
        <thead>
          <tr>
            {columns.map(([key, label]) => (
              <th
                className={th}
                key={key}
                aria-sort={sort === key ? (asc ? 'ascending' : 'descending') : 'none'}
              >
                <button
                  type="button"
                  className="inline-flex cursor-pointer items-center gap-0.5 border-0 bg-transparent p-0 text-[length:inherit] tracking-[inherit] text-inherit uppercase"
                  onClick={() => onSort(key)}
                >
                  {label}
                  {sort === key && (asc ? <ArrowUp size={12} /> : <ArrowDown size={12} />)}
                </button>
              </th>
            ))}
            <th className={th}>
              <span className="sr-only">Actions</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {accounts.map((a) => (
            <tr key={a.id} className="group/row hover:bg-muted">
              <td className={td}>{a.provider}</td>
              <td className={td}>
                <button type="button" className={cellLink} onClick={() => onOpen(a.id)}>
                  {a.login_name}
                </button>
              </td>
              <td className={td}>{a.email}</td>
              <td className={td}>{a.external_account_id}</td>
              <td className={td}>
                <Status account={a} />
              </td>
              <td className={td}>{localDate(a.created_at)}</td>
              <td className={td}>
                <AccountActions account={a} onEdit={onEdit} onDelete={onDelete} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
