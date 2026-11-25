import { Field as BaseField } from '@base-ui/react/field'
import { Switch } from '@base-ui/react/switch'

export function SwitchField({ label, checked, onChange }) {
  return (
    <BaseField.Root className="switch-field">
      <BaseField.Label className="switch-label">
        <Switch.Root checked={checked} onCheckedChange={onChange} className="switch">
          <Switch.Thumb className="switch-thumb" />
        </Switch.Root>
        {label}
      </BaseField.Label>
    </BaseField.Root>
  )
}
