'use client'
import { Close } from '@mui/icons-material'
import { Box, Button, Chip, Divider, Drawer, IconButton, Stack, Typography } from '@mui/material'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect, useRef, useState } from 'react'
import { Busy, Copy, ErrorBox, localDate } from '@/components/common'
import { query, request } from '@/lib/api/client'
import type { Account, ApiError } from '@/lib/api/types'
import { c } from '@/lib/copy'
export function AccountDetail({
  id,
  onClose,
  onEdit,
}: {
  id: string
  onClose: () => void
  onEdit: (account: Account) => void
}) {
  const client = useQueryClient()
  const account = useQuery({
    queryKey: ['account', id],
    queryFn: () => query<{ account: Account }>(`/api/accounts/${id}`),
  })
  const [secret, setSecret] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<ApiError | null>(null)
  const sequence = useRef(0)
  const guard = useRef(false)
  useEffect(() => {
    if ((account.error as ApiError | null)?.status === 404 || error?.status === 404) {
      void client.invalidateQueries({ queryKey: ['accounts'] })
      void client.invalidateQueries({ queryKey: ['stats'] })
    }
  }, [account.error, error, client])
  useEffect(
    () => () => {
      sequence.current++
    },
    [],
  )
  useEffect(() => {
    if (secret === null) return
    const timer = setTimeout(() => {
      setSecret(null)
      sequence.current++
    }, 30000)
    return () => clearTimeout(timer)
  }, [secret])
  async function reveal() {
    if (guard.current) return
    guard.current = true
    setBusy(true)
    setError(null)
    const current = ++sequence.current
    const r = await request<{ secret_key: string }>(`/api/accounts/${id}/secret-key`)
    if (current === sequence.current) {
      if (r.ok) setSecret(r.data.secret_key)
      else setError(r.error)
      setBusy(false)
    }
    guard.current = false
  }
  const a = account.data?.account
  return (
    <Drawer
      anchor="right"
      open
      onClose={onClose}
      sx={{ '& .MuiDrawer-paper': { width: { xs: '100%', sm: 440 }, p: 3 } }}
    >
      <Stack direction="row" sx={{ alignItems: 'center', justifyContent: 'space-between' }}>
        <Typography variant="h6">{c.details}</Typography>
        <IconButton aria-label={c.close} onClick={onClose}>
          <Close />
        </IconButton>
      </Stack>
      <Divider sx={{ my: 2 }} />
      <ErrorBox error={account.error} retry={() => void account.refetch()} />
      {account.isPending ? (
        <Busy />
      ) : (
        a && (
          <Stack spacing={2.5}>
            {(
              [
                [c.id, a.id],
                [c.provider, a.provider],
                [c.loginName, a.login_name],
                [c.email, a.email],
                [c.externalId, a.external_account_id],
                [c.createdAt, localDate(a.created_at)],
              ] as const
            ).map(([label, value]) => (
              <Box key={label}>
                <Typography variant="caption" color="text.secondary">
                  {label}
                </Typography>
                <Stack direction="row" sx={{ alignItems: 'center', gap: 1 }}>
                  <Typography sx={{ flex: 1, minWidth: 0 }}>{value}</Typography>
                  {[c.loginName, c.email, c.externalId].some((v) => v === label) && (
                    <Copy value={value} label={`${c.copy} ${label}`} />
                  )}
                </Stack>
              </Box>
            ))}
            <Chip
              label={a.is_limit ? c.limited : c.unlimited}
              color={a.is_limit ? 'warning' : 'success'}
              variant="outlined"
              sx={{ alignSelf: 'flex-start' }}
            />
            <Divider />
            <Box>
              <Typography variant="caption" color="text.secondary">
                {c.secret}
              </Typography>
              <Stack direction="row" sx={{ alignItems: 'center', gap: 1 }}>
                <Typography component="code" sx={{ flex: 1, minWidth: 0, whiteSpace: 'pre-wrap' }}>
                  {secret ?? '••••••'}
                </Typography>
                {secret !== null && <Copy value={secret} label={`${c.copy} ${c.secret}`} />}
              </Stack>
              <Button
                loading={busy}
                onClick={() => {
                  if (secret !== null) {
                    setSecret(null)
                    sequence.current++
                  } else void reveal()
                }}
              >
                {secret !== null ? c.hide : c.reveal}
              </Button>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                {c.secretHint}
              </Typography>
              <ErrorBox error={error} />
            </Box>
            <Box>
              <Typography variant="body2" color="text.secondary">
                {c.passwordHint}
              </Typography>
              <Button
                onClick={() => {
                  setSecret(null)
                  sequence.current++
                  onEdit(a)
                }}
              >
                {c.setPassword}
              </Button>
            </Box>
            <Button
              variant="outlined"
              onClick={() => {
                setSecret(null)
                sequence.current++
                onEdit(a)
              }}
            >
              {c.editAccount}
            </Button>
          </Stack>
        )
      )}
    </Drawer>
  )
}
