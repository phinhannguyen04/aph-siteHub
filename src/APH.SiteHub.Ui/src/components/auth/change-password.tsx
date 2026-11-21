'use client'
import { useRef, useState } from 'react'
import { Button, ErrorBox, Modal, PasswordField, Progress } from '@/components/common'
import { useNotice } from '@/components/layout/providers'
import { request, setToken } from '@/lib/api/client'
import type { ApiError } from '@/lib/api/types'
import { c } from '@/lib/copy'
import { type PasswordErrors, changePassword as validate } from '@/lib/validation'

const strengthTone = ['primary', 'error', 'warning', 'info', 'success'] as const

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
    <Modal
      title={c.changePassword}
      size="xs"
      onClose={busy ? undefined : onClose}
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
      actions={
        <>
          <Button variant="ghost" onClick={onClose} disabled={busy}>
            {c.cancel}
          </Button>
          <Button variant="primary" type="submit" loading={busy}>
            {c.save}
          </Button>
        </>
      }
    >
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
      <div>
        <PasswordField
          label={c.newPassword}
          error={!!validation.newPassword}
          helperText={validation.newPassword ?? c.passwordRule}
          autoComplete="new-password"
          value={next}
          onChange={(e) => setNext(e.target.value)}
          required
        />
        <Progress
          className="mt-2"
          tone={strengthTone[strength]}
          value={strength}
          max={4}
          label={c.strength(strength)}
        />
      </div>
      <PasswordField
        label={c.confirmPassword}
        error={!!validation.confirmPassword}
        helperText={validation.confirmPassword}
        autoComplete="new-password"
        value={confirm}
        onChange={(e) => setConfirm(e.target.value)}
        required
      />
    </Modal>
  )
}
