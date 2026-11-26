import { cva } from 'class-variance-authority'
import { Slot } from 'radix-ui'
import { cn } from '@/lib/utils'

const buttonVariants = cva(
  'inline-flex shrink-0 cursor-pointer items-center justify-center gap-1.5 rounded-md border border-transparent font-semibold whitespace-nowrap no-underline transition-colors duration-200 select-none disabled:cursor-not-allowed aria-disabled:cursor-not-allowed [&_svg]:pointer-events-none [&_svg]:shrink-0',
  {
    variants: {
      variant: {
        default:
          'border-primary bg-primary text-primary-foreground hover:bg-[var(--accent-hover)] active:bg-[var(--accent-hover)] disabled:border-[var(--text-tertiary)] disabled:bg-[var(--text-tertiary)] disabled:text-[var(--text-inverse)] aria-disabled:border-[var(--text-tertiary)] aria-disabled:bg-[var(--text-tertiary)] aria-disabled:text-[var(--text-inverse)]',
        outline:
          'border-input bg-background text-secondary-foreground hover:bg-muted active:bg-border disabled:border-border disabled:text-[var(--text-tertiary)]',
        secondary: 'bg-secondary text-secondary-foreground hover:bg-border',
        ghost:
          'bg-transparent text-secondary-foreground hover:bg-muted active:bg-border disabled:text-[var(--text-tertiary)]',
        destructive:
          'border-destructive bg-destructive text-[var(--text-inverse)] hover:bg-[var(--danger-hover)] disabled:border-[var(--text-tertiary)] disabled:bg-[var(--text-tertiary)] aria-disabled:border-[var(--text-tertiary)] aria-disabled:bg-[var(--text-tertiary)]',
        link: 'text-primary underline-offset-4 hover:underline',
      },
      size: {
        default: 'min-h-8 px-3',
        sm: 'min-h-6 px-2',
        icon: 'size-8 p-0',
        'icon-sm': 'size-6 p-0',
      },
    },
    defaultVariants: { variant: 'default', size: 'default' },
  },
)

function Button({ className, variant = 'default', size = 'default', asChild = false, ...props }) {
  const Comp = asChild ? Slot.Root : 'button'
  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    />
  )
}

export { Button, buttonVariants }
