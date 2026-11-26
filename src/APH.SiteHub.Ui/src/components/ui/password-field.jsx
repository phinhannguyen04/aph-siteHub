import { Eye, EyeOff } from 'lucide-react'
import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { c } from '@/lib/copy'
import { Button } from './app-button'
import { FieldShell } from './form-field'

export function PasswordField({ label, error, helperText, ...props }) {
  const [shown, setShown] = useState(false)
  return (
    <FieldShell
      label={label}
      error={error}
      helperText={helperText}
      control={(a11y) => (
        <div className="input-wrap">
          <Input
            {...a11y}
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
      )}
    />
  )
}
