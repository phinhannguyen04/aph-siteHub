import { cn } from '@/lib/utils'

function Textarea({ className, ...props }) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        'min-h-8 w-full resize-y rounded-md border border-input bg-background px-2 py-1.5 text-secondary-foreground outline-none placeholder:text-[var(--text-subtle)] hover:not-disabled:border-[var(--text-tertiary)] focus-visible:border-primary focus-visible:outline-2 focus-visible:-outline-offset-1 focus-visible:outline-primary disabled:cursor-not-allowed disabled:text-[var(--text-tertiary)] aria-invalid:border-destructive',
        className,
      )}
      {...props}
    />
  )
}

export { Textarea }
