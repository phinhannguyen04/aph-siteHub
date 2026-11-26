import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'

/** Tooltip around any focusable element; supplementary only (the element keeps its own accessible name). */
export function Hint({ label, disabled, children, side = 'bottom' }) {
  if (disabled) return children
  return (
    <Tooltip>
      <TooltipTrigger asChild>{children}</TooltipTrigger>
      <TooltipContent side={side} sideOffset={6}>
        {label}
      </TooltipContent>
    </Tooltip>
  )
}
