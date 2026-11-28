import { cva } from 'class-variance-authority'
import { Slot } from 'radix-ui'
import { cn } from '@/lib/utils'

const badgeVariants = cva(
  'inline-flex w-fit shrink-0 items-center gap-0.5 rounded-md px-2 py-0.5 text-xs font-semibold whitespace-nowrap',
  {
    variants: {
      variant: {
        default: 'bg-muted text-secondary-foreground',
        secondary: 'bg-secondary text-secondary-foreground',
        destructive: 'bg-[var(--danger-soft)] text-destructive',
        success: 'bg-[var(--ok-soft)] text-[var(--ok)]',
        warning: 'bg-[var(--warn-soft)] text-[var(--warn)]',
        outline: 'border border-border text-foreground',
      },
    },
    defaultVariants: { variant: 'default' },
  },
)

function Badge({ className, variant = 'default', asChild = false, ...props }) {
  const Comp = asChild ? Slot.Root : 'span'
  return <Comp data-slot="badge" className={cn(badgeVariants({ variant }), className)} {...props} />
}

export { Badge, badgeVariants }
