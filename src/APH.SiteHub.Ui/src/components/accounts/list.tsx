'use client'
import { Mail } from 'lucide-react'
import type { ReactNode } from 'react'
import type { Account } from '@/lib/api/types'
import { c } from '@/lib/copy'
import { Status } from './status'
export function AccountList({
  accounts,
  actions,
  onDetail,
}: {
  accounts: Account[]
  actions: (account: Account) => ReactNode
  onDetail: (id: string) => void
}) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {accounts.map((a) => (
        <article key={a.id} className="card card-border border-base-300 bg-base-100">
          <div className="card-body gap-2 p-5">
            <div className="flex items-center justify-between gap-2">
              <span className="badge badge-ghost badge-sm font-medium">{a.provider}</span>
              <Status account={a} />
            </div>
            <button
              type="button"
              onClick={() => onDetail(a.id)}
              className="link link-hover mt-1 text-start text-lg font-semibold [overflow-wrap:anywhere]"
            >
              {a.login_name}
            </button>
            <p className="flex items-center gap-1.5 text-sm text-base-content/70">
              <Mail size={14} className="shrink-0" aria-hidden />
              <span className="min-w-0">{a.email}</span>
            </p>
            <p className="font-mono text-xs text-base-content/60">{a.external_account_id}</p>
            <div className="card-actions mt-2 items-center justify-between border-t border-base-300 pt-3">
              <button
                type="button"
                className="btn btn-ghost btn-sm -ms-2"
                onClick={() => onDetail(a.id)}
              >
                {c.details}
              </button>
              {actions(a)}
            </div>
          </div>
        </article>
      ))}
    </div>
  )
}
