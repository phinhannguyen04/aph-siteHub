import { Select as BaseSelect } from '@base-ui/react/select'
import { Check, ChevronsUpDown } from 'lucide-react'

/** Base UI Select. `options` is `[{ value, label }]`; values must be non-empty strings or numbers. */
export function Select({ label, value, onValueChange, options }) {
  return (
    <BaseSelect.Root items={options} value={value} onValueChange={onValueChange}>
      <BaseSelect.Trigger className="select" aria-label={label}>
        <BaseSelect.Value>{(v) => options.find((o) => o.value === v)?.label ?? v}</BaseSelect.Value>
        <BaseSelect.Icon>
          <ChevronsUpDown size={13} aria-hidden />
        </BaseSelect.Icon>
      </BaseSelect.Trigger>
      <BaseSelect.Portal>
        <BaseSelect.Positioner className="positioner" sideOffset={4} alignItemWithTrigger={false}>
          <BaseSelect.Popup className="popup">
            <BaseSelect.List>
              {options.map((o) => (
                <BaseSelect.Item key={o.value} value={o.value} className="item">
                  <BaseSelect.ItemIndicator className="item-check">
                    <Check size={13} aria-hidden />
                  </BaseSelect.ItemIndicator>
                  <BaseSelect.ItemText>{o.label}</BaseSelect.ItemText>
                </BaseSelect.Item>
              ))}
            </BaseSelect.List>
          </BaseSelect.Popup>
        </BaseSelect.Positioner>
      </BaseSelect.Portal>
    </BaseSelect.Root>
  )
}
