import { Field as BaseField } from '@base-ui/react/field'
import { FieldMessages } from './field-messages'
import { cx } from './utils'

export function Field({ label, error, helperText, className, ...props }) {
  return (
    <BaseField.Root invalid={!!error} className={cx('field', className)}>
      <BaseField.Label className="label">{label}</BaseField.Label>
      <BaseField.Control className="input" {...props} />
      <FieldMessages error={error} helperText={helperText} />
    </BaseField.Root>
  )
}
