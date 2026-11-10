'use client'
import { Globe, LockKeyhole } from 'lucide-react'
import { usePathname, useRouter } from 'next/navigation'
import { useRef, useState } from 'react'
import { Button, ErrorBox, PasswordField } from '@/components/common'
import { request, setToken } from '@/lib/api/client'
import type { ApiError } from '@/lib/api/types'
import { c } from '@/lib/copy'
import { type FieldErrors, login as validate } from '@/lib/validation'
export function Login({ expired, onSuccess }: { expired: boolean; onSuccess: () => void }) {
  const [password, setPassword] = useState('')
  const [validation, setValidation] = useState<FieldErrors<'password'>>({})
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<ApiError | null>(null)
  const guard = useRef(false)
  const router = useRouter()
  const path = usePathname()
  return (
    <div className="relative grid min-h-dvh place-items-center overflow-hidden p-4">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(60rem_30rem_at_50%_-10%,color-mix(in_oklab,var(--color-primary)_22%,transparent),transparent)]"
      />
      <div className="card relative w-full max-w-sm border border-base-300 bg-base-100 shadow-xl">
        <form
          noValidate
          className="card-body gap-5 p-6 sm:p-8"
          onSubmit={async (e) => {
            e.preventDefault()
            if (guard.current) return
            const errors = validate(password)
            setValidation(errors)
            if (Object.keys(errors).length) return
            guard.current = true
            setBusy(true)
            setError(null)
            const r = await request<{ csrfToken: string }>('/api/auth/login', 'POST', {
              password,
            })
            if (r.ok) {
              setToken(r.data.csrfToken)
              setPassword('')
              onSuccess()
              if (path === '/login') router.replace('/')
            } else
              setError({
                ...r.error,
                message:
                  r.error.status === 401
                    ? c.incorrect
                    : r.error.status === 429
                      ? c.locked
                      : r.error.message,
              })
            guard.current = false
            setBusy(false)
          }}
        >
          <div className="flex items-center gap-3">
            <span className="grid size-11 place-items-center rounded-xl bg-primary text-primary-content">
              <Globe size={22} aria-hidden />
            </span>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">{c.app}</h1>
              <p className="text-sm text-base-content/70">{c.loginIntro}</p>
            </div>
          </div>
          {expired && (
            <div role="status" className="alert alert-warning alert-soft text-sm">
              {c.expired}
            </div>
          )}
          <ErrorBox error={error} />
          <PasswordField
            label={c.password}
            error={!!validation.password}
            helperText={validation.password}
            autoFocus
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={busy}
            start={<LockKeyhole size={16} className="opacity-50" aria-hidden />}
          />
          <Button type="submit" className="btn-primary btn-block" loading={busy}>
            {c.signIn}
          </Button>
        </form>
      </div>
    </div>
  )
}
