import { Badge as ShadcnBadge } from '@/components/ui/badge'

const variants = { ok: 'success', warn: 'warning' }

/** shadcn Badge; `tone` is `ok`, `warn` or omitted (neutral). */
export function Badge({ tone, className, children }) {
  return (
    <ShadcnBadge variant={variants[tone] ?? 'default'} className={className}>
      {children}
    </ShadcnBadge>
  )
}
