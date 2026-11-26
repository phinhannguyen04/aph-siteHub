import { ArrowDown, ArrowUp } from 'lucide-react'
import { localDate } from '@/components/ui'
import { c } from '@/lib/copy'
import { AccountActions } from './account-actions'
import { Status } from './account-status'

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
    <div className="card table-wrap">
      <table>
        <thead>
          <tr>
            {columns.map(([key, label]) => (
              <th key={key} aria-sort={sort === key ? (asc ? 'ascending' : 'descending') : 'none'}>
                <button type="button" onClick={() => onSort(key)}>
                  {label}
                  {sort === key && (asc ? <ArrowUp size={12} /> : <ArrowDown size={12} />)}
                </button>
              </th>
            ))}
            <th>
              <span className="sr-only">Actions</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {accounts.map((a) => (
            <tr key={a.id}>
              <td>{a.provider}</td>
              <td>
                <button type="button" className="cell-link" onClick={() => onOpen(a.id)}>
                  {a.login_name}
                </button>
              </td>
              <td>{a.email}</td>
              <td>{a.external_account_id}</td>
              <td>
                <Status account={a} />
              </td>
              <td>{localDate(a.created_at)}</td>
              <td>
                <AccountActions account={a} onEdit={onEdit} onDelete={onDelete} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
