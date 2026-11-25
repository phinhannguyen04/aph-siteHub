import { Tooltip } from '@base-ui/react/tooltip'

/** Tooltip around any focusable element; supplementary only (the element keeps its own accessible name). */
export function Hint({ label, disabled, children, side = 'bottom' }) {
  return (
    <Tooltip.Root disabled={disabled}>
      <Tooltip.Trigger render={children} />
      <Tooltip.Portal>
        <Tooltip.Positioner side={side} sideOffset={6}>
          <Tooltip.Popup className="tooltip">{label}</Tooltip.Popup>
        </Tooltip.Positioner>
      </Tooltip.Portal>
    </Tooltip.Root>
  )
}
