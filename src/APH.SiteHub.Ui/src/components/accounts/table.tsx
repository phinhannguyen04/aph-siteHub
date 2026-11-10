'use client'
import { ArrowDown, ArrowUp, ArrowUpDown } from 'lucide-react'
import type { ReactNode } from 'react'
import { localDate } from '@/components/common'
import type { Account } from '@/lib/api/types'
import { c } from '@/lib/copy'
import { Status } from './status'
export type SortKey =
  | 'provider'
  | 'login_name'
  | 'email'
  | 'external_account_id'
  | 'is_limit'
  | 'created_at'
const columns: { key: SortKey; label: string }[] = [
  { key: 'provider', label: c.provider },
  { key: 'login_name', label: c.loginName },
  { key: 'email', label: c.email },
  { key: 'external_account_id', label: c.externalId },
  { key: 'is_limit', label: c.status },
  { key: 'created_at', label: c.createdAt },
]
export function AccountTable({
  accounts,
  sort,
  asc,
  onSort,
  actions,
  onDetail,
}: {
  accounts: Account[]
  sort: SortKey
  asc: boolean
  onSort: (key: SortKey) => void
  actions: (a: Account) => ReactNode
  onDetail: (id: string) => void
}) {
  return (
    <div className="hidden overflow-x-auto rounded-box border border-base-300 bg-base-100 md:block">
      <table className="table table-sm">
        <thead>
          <tr className="bg-base-200/60">
            {columns.map((col) => {
              const active = sort === col.key
              const Icon = active ? (asc ? ArrowUp : ArrowDown) : ArrowUpDown
              return (
                <th
                  key={col.key}
                  aria-sort={active ? (asc ? 'ascending' : 'descending') : undefined}
                >
                  <button
                    type="button"
                    className="btn btn-ghost btn-xs -ms-2 gap-1 font-semibold"
                    onClick={() => onSort(col.key)}
                  >
                    {col.label}
                    <Icon size={12} className={active ? '' : 'opacity-40'} aria-hidden />
                  </button>
                </th>
              )
            })}
            <th className="text-end">{c.edit}</th>
          </tr>
        </thead>
        <tbody>
          {accounts.map((a) => (
            <tr key={a.id} className="hover:bg-base-200/50">
              {columns.map((col) => (
                <td key={col.key} className="max-w-56 [overflow-wrap:anywhere]">
                  {col.key === 'is_limit' ? (
                    <Status account={a} />
                  ) : col.key === 'created_at' ? (
                    <span className="whitespace-nowrap text-base-content/70">
                      {localDate(a.created_at)}
                    </span>
                  ) : col.key === 'login_name' ? (
                    <button
                      type="button"
                      onClick={() => onDetail(a.id)}
                      className="link link-hover link-primary text-start font-medium [overflow-wrap:anywhere]"
                    >
                      {a.login_name}
                    </button>
                  ) : col.key === 'external_account_id' ? (
                    <span className="font-mono text-xs">{a[col.key]}</span>
                  ) : (
                    a[col.key]
                  )}
                </td>
              ))}
              <td className="whitespace-nowrap">
                <div className="flex justify-end">{actions(a)}</div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
