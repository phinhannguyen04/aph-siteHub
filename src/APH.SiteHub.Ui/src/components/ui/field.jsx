import { cva } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const fieldVariants = cva(
  'group/field flex w-full min-w-0 gap-0.5 data-[invalid=true]:text-destructive',
  {
    variants: {
      orientation: {
        vertical: 'flex-col *:w-full [&>.sr-only]:w-auto',
        horizontal: 'flex-row items-center',
      },
    },
    defaultVariants: { orientation: 'vertical' },
  },
)

function Field({ className, orientation = 'vertical', ...props }) {
  return (
    // biome-ignore lint/a11y/useSemanticElements: shadcn Field is a generic group; fieldset would add browser chrome.
    <div
      role="group"
      data-slot="field"
      data-orientation={orientation}
      className={cn(fieldVariants({ orientation }), className)}
      {...props}
    />
  )
}

function FieldDescription({ className, ...props }) {
  return (
    <p
      data-slot="field-description"
      className={cn('text-xs text-[var(--text-subtle)]', className)}
      {...props}
    />
  )
}

function FieldError({ className, children, ...props }) {
  if (!children) return null
  return (
    <div
      role="alert"
      data-slot="field-error"
      className={cn('text-xs text-destructive', className)}
      {...props}
    >
      {children}
    </div>
  )
}

export { Field, FieldDescription, FieldError }
