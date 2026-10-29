'use client'
import { Visibility, VisibilityOff } from '@mui/icons-material'
import { IconButton, InputAdornment, TextField } from '@mui/material'
import { type ComponentProps, useState } from 'react'
import { c } from '@/lib/copy'

export function PasswordField(props: ComponentProps<typeof TextField>) {
  const [visible, setVisible] = useState(false)
  return (
    <TextField
      {...props}
      type={visible ? 'text' : 'password'}
      slotProps={{
        ...props.slotProps,
        input: (ownerState) => {
          const input =
            typeof props.slotProps?.input === 'function'
              ? props.slotProps.input(ownerState)
              : props.slotProps?.input
          return {
            ...input,
            endAdornment: (
              <>
                {input?.endAdornment}
                <InputAdornment position="end">
                  <IconButton
                    aria-label={visible ? c.hidePassword : c.showPassword}
                    onClick={() => setVisible(!visible)}
                    edge="end"
                  >
                    {visible ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              </>
            ),
          }
        },
      }}
    />
  )
}
