import { Field as BaseField } from '@base-ui/react/field'

/** Helper text, or the error message when `error` is set. Shared by every form control. */
export function FieldMessages({ error, helperText }) {
  if (!helperText) return null
  return error ? (
    <BaseField.Error match className="help error">
      {helperText}
    </BaseField.Error>
  ) : (
    <BaseField.Description className="help">{helperText}</BaseField.Description>
  )
}
