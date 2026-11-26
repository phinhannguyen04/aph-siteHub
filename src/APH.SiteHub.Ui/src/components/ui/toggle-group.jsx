import { ToggleGroup as ToggleGroupPrimitive } from 'radix-ui'

function ToggleGroup(props) {
  return <ToggleGroupPrimitive.Root data-slot="toggle-group" {...props} />
}

function ToggleGroupItem(props) {
  return <ToggleGroupPrimitive.Item data-slot="toggle-group-item" {...props} />
}

export { ToggleGroup, ToggleGroupItem }
