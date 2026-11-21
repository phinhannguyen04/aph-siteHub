'use client'
import { Eye, EyeOff } from 'lucide-react'
import { useState } from 'react'
import { c } from '@/lib/copy'
import { Button } from './button'
import { Field, type FieldProps } from './field'

export function PasswordField({ end, ...props }: Omit<FieldProps, 'type'>) {
  const [visible, setVisible] = useState(false)
  return (
    <Field
      {...props}
      type={visible ? 'text' : 'password'}
      end={
        <>
          {end}
          <Button
            variant="ghost"
            size="xs"
            square
            className="-me-1"
            aria-label={visible ? c.hidePassword : c.showPassword}
            onClick={() => setVisible(!visible)}
          >
            {visible ? <EyeOff size={16} /> : <Eye size={16} />}
          </Button>
        </>
      }
    />
  )
}
