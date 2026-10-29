'use client'
import { LockOutlined } from '@mui/icons-material'
import { Box, Button, Card, CardContent, Stack, Typography } from '@mui/material'
import { usePathname, useRouter } from 'next/navigation'
import { useRef, useState } from 'react'
import { ErrorBox, PasswordField } from '@/components/common'
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
    <Box sx={{ minHeight: '100dvh', display: 'grid', placeItems: 'center', p: 2 }}>
      <Card sx={{ width: '100%', maxWidth: 420 }}>
        <CardContent sx={{ p: { xs: 3, sm: 4 } }}>
          <Stack
            component="form"
            noValidate
            spacing={3}
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
            <LockOutlined color="primary" sx={{ fontSize: 32 }} />
            <Box>
              <Typography variant="h4" component="h1">
                {c.app}
              </Typography>
              <Typography color="text.secondary" sx={{ mt: 1 }}>
                {c.loginIntro}
              </Typography>
            </Box>
            {expired && (
              <Typography role="status" color="error">
                {c.expired}
              </Typography>
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
            />
            <Button variant="contained" type="submit" loading={busy}>
              {c.signIn}
            </Button>
          </Stack>
        </CardContent>
      </Card>
    </Box>
  )
}
