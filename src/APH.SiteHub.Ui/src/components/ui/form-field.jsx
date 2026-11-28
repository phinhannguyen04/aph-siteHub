import { useId } from 'react'
import { Field, FieldDescription, FieldError } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

/** Shared label + helper/error text wrapper for every form control. `control(props)` renders the input. */
export function FieldShell({ label, error, helperText, className, control }) {
  const id = useId()
  const helpId = `${id}-help`
  return (
    <Field data-invalid={error ? 'true' : undefined} className={className}>
      <Label htmlFor={id}>{label}</Label>
      {control({
        id,
        'aria-invalid': error ? true : undefined,
        'aria-describedby': helperText ? helpId : undefined,
      })}
      {helperText &&
        (error ? (
          <FieldError id={helpId}>{helperText}</FieldError>
        ) : (
          <FieldDescription id={helpId}>{helperText}</FieldDescription>
        ))}
    </Field>
  )
}

export function FormField({ label, error, helperText, className, ...props }) {
  return (
    <FieldShell
      label={label}
      error={error}
      helperText={helperText}
      className={className}
      control={(a11y) => <Input {...a11y} {...props} />}
    />
  )
}
