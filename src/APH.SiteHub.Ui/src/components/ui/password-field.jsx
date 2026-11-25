import { Field as BaseField } from '@base-ui/react/field'
import { Eye, EyeOff } from 'lucide-react'
import { useState } from 'react'
import { c } from '@/lib/copy'
import { Button } from './button'
import { FieldMessages } from './field-messages'

export function PasswordField({ label, error, helperText, ...props }) {
  const [shown, setShown] = useState(false)
  return (
    <BaseField.Root invalid={!!error} className="field">
      <BaseField.Label className="label">{label}</BaseField.Label>
      <div className="input-wrap">
        <BaseField.Control
          className="input"
          type={shown ? 'text' : 'password'}
          autoCapitalize="off"
          spellCheck={false}
          {...props}
        />
        <Button
          variant="ghost"
          size="sm"
          icon
          aria-label={shown ? c.hidePassword : c.showPassword}
          aria-pressed={shown}
          onClick={() => setShown(!shown)}
        >
          {shown ? <EyeOff size={14} /> : <Eye size={14} />}
        </Button>
      </div>
      <FieldMessages error={error} helperText={helperText} />
    </BaseField.Root>
  )
}
