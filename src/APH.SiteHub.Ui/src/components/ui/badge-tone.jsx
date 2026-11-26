import { Badge as ShadcnBadge } from '@/components/ui/badge'

const variants = { ok: 'success', warn: 'warning' }

/** shadcn Badge; `tone` is `ok`, `warn` or omitted (neutral). */
export function Badge({ tone, children }) {
  return <ShadcnBadge variant={variants[tone] ?? 'default'}>{children}</ShadcnBadge>
}
