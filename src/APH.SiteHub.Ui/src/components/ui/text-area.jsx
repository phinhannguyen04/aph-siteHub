import { Field as BaseField } from '@base-ui/react/field'
import { FieldMessages } from './field-messages'

export function TextArea({ label, error, helperText, ...props }) {
  return (
    <BaseField.Root invalid={!!error} className="field">
      <BaseField.Label className="label">{label}</BaseField.Label>
      <BaseField.Control render={<textarea />} className="textarea" {...props} />
      <FieldMessages error={error} helperText={helperText} />
    </BaseField.Root>
  )
}
