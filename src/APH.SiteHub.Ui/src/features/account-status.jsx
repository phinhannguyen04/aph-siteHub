import { Badge } from '@/components/ui'
import { c } from '@/lib/copy'

export function Status({ account }) {
  return account.is_limit ? (
    <Badge tone="warn">{c.limited}</Badge>
  ) : (
    <Badge tone="ok">{c.unlimited}</Badge>
  )
}
