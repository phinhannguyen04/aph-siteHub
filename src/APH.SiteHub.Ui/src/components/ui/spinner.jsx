import { c } from '@/lib/copy'
import { cn } from '@/lib/utils'

export const spinnerClass =
  'size-[1em] animate-[spin_0.7s_linear_infinite] rounded-full border-2 border-current border-e-transparent'

export function Spinner({ className }) {
  return <span className={cn(spinnerClass, className)} role="status" aria-label={c.loading} />
}
