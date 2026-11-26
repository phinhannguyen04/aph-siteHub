import { Label as LabelPrimitive } from 'radix-ui'
import { cn } from '@/lib/utils'

function Label({ className, ...props }) {
  return (
    <LabelPrimitive.Root
      data-slot="label"
      className={cn(
        'flex items-center gap-2 font-semibold text-secondary-foreground select-none peer-disabled:cursor-not-allowed peer-disabled:opacity-50',
        className,
      )}
      {...props}
    />
  )
}

export { Label }
