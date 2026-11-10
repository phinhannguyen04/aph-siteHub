'use client'
import type { Account } from '@/lib/api/types'
import { c } from '@/lib/copy'
import { cx } from '@/lib/cx'

export function Status({ account }: { account: Account }) {
  return (
    <span
      className={cx(
        'badge badge-soft badge-sm gap-1.5 whitespace-nowrap',
        account.is_limit ? 'badge-warning' : 'badge-success',
      )}
    >
      <span className="status status-xs bg-current" aria-hidden />
      {account.is_limit ? c.limited : c.unlimited}
    </span>
  )
}
