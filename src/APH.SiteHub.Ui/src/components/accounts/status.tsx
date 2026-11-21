'use client'
import { Badge } from '@/components/common'
import type { Account } from '@/lib/api/types'
import { c } from '@/lib/copy'

export function Status({ account }: { account: Account }) {
  return (
    <Badge size="sm" tone={account.is_limit ? 'warning' : 'success'} className="whitespace-nowrap">
      <span className="size-1.5 rounded-full bg-current" aria-hidden />
      {account.is_limit ? c.limited : c.unlimited}
    </Badge>
  )
}
