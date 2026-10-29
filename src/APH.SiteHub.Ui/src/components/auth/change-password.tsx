'use client'
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  LinearProgress,
  Stack,
} from '@mui/material'
import { useRef, useState } from 'react'
import { ErrorBox, PasswordField } from '@/components/common'
import { useNotice } from '@/components/layout/providers'
import { request, setToken } from '@/lib/api/client'
import type { ApiError } from '@/lib/api/types'
import { c } from '@/lib/copy'
import { type PasswordErrors, changePassword as validate } from '@/lib/validation'
export function ChangePassword({ onClose }: { onClose: () => void }) {
  const [current, setCurrent] = useState('')
  const [next, setNext] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState<ApiError | null>(null)
  const [validation, setValidation] = useState<PasswordErrors>({})
  const [busy, setBusy] = useState(false)
  const guard = useRef(false)
  const notify = useNotice()
  const strength =
    Number(next.length >= 12) +
    Number(next.length >= 20) +
    Number(/[a-z]/.test(next) && /[A-Z]/.test(next)) +
    Number(/\d/.test(next) && /[^\w]/.test(next))
  return (
    <Dialog
      open
      onClose={busy ? undefined : onClose}
      fullWidth
      maxWidth="xs"
      aria-labelledby="password-title"
    >
      <Box
        component="form"
        noValidate
        onSubmit={async (e) => {
          e.preventDefault()
          if (guard.current) return
          const errors = validate(current, next, confirm)
          setValidation(errors)
          if (Object.keys(errors).length) return
          guard.current = true
          setBusy(true)
          const r = await request<{ csrfToken: string }>('/api/auth/change-password', 'POST', {
            currentPassword: current,
            newPassword: next,
          })
          if (r.ok) {
            setToken(r.data.csrfToken)
            notify(c.passwordChanged)
            onClose()
          } else
            setError({
              ...r.error,
              message: r.error.status === 401 ? c.incorrect : r.error.message,
            })
          guard.current = false
          setBusy(false)
        }}
      >
        <DialogTitle id="password-title">{c.changePassword}</DialogTitle>
        <DialogContent>
          <Stack spacing={2.5} sx={{ pt: 1 }}>
            <ErrorBox error={error} />
            <PasswordField
              autoFocus
              label={c.currentPassword}
              error={!!validation.currentPassword}
              helperText={validation.currentPassword}
              autoComplete="current-password"
              value={current}
              onChange={(e) => setCurrent(e.target.value)}
              required
            />
            <PasswordField
              label={c.newPassword}
              error={!!validation.newPassword}
              helperText={validation.newPassword ?? c.passwordRule}
              autoComplete="new-password"
              value={next}
              onChange={(e) => setNext(e.target.value)}
              required
            />
            <LinearProgress
              variant="determinate"
              value={strength * 25}
              aria-label={c.strength(strength)}
            />
            <PasswordField
              label={c.confirmPassword}
              error={!!validation.confirmPassword}
              helperText={validation.confirmPassword}
              autoComplete="new-password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              required
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose} disabled={busy}>
            {c.cancel}
          </Button>
          <Button variant="contained" type="submit" loading={busy}>
            {c.save}
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  )
}
