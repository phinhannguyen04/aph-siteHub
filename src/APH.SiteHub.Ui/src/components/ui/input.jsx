import { cn } from '@/lib/utils'

function Input({ className, type, ...props }) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        'min-h-8 w-full min-w-0 rounded-md border border-input bg-background px-2 py-1.5 text-secondary-foreground outline-none placeholder:text-[var(--text-subtle)] hover:not-disabled:border-[var(--text-tertiary)] focus-visible:border-primary focus-visible:outline-2 focus-visible:-outline-offset-1 focus-visible:outline-primary read-only:bg-secondary read-only:text-muted-foreground disabled:cursor-not-allowed disabled:text-[var(--text-tertiary)] aria-invalid:border-destructive',
        className,
      )}
      {...props}
    />
  )
}

export { Input }
