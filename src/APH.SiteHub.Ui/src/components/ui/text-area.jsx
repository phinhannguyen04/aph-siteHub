import { Textarea } from '@/components/ui/textarea'
import { FieldShell } from './form-field'

export function TextArea({ label, error, helperText, ...props }) {
  return (
    <FieldShell
      label={label}
      error={error}
      helperText={helperText}
      control={(a11y) => <Textarea {...a11y} {...props} />}
    />
  )
}
