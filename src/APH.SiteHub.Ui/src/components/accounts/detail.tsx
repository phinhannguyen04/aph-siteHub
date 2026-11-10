'use client'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Eye, EyeOff, KeyRound, Pencil } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Busy, Button, Copy, ErrorBox, localDate, Modal } from '@/components/common'
import { query, request } from '@/lib/api/client'
import type { Account, ApiError } from '@/lib/api/types'
import { c } from '@/lib/copy'
import { Status } from './status'
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
  const edit = (target: Account) => {
    setSecret(null)
    sequence.current++
    onEdit(target)
  }
  return (
    <Modal title={c.details} placement="end" closeButton onClose={onClose}>
      <ErrorBox error={account.error} retry={() => void account.refetch()} />
      {account.isPending ? (
        <Busy />
      ) : (
        a && (
          <div className="flex flex-col gap-5">
            <div className="flex items-center justify-between gap-2">
              <span className="badge badge-ghost font-medium">{a.provider}</span>
              <Status account={a} />
            </div>
            <dl className="divide-y divide-base-300 rounded-box border border-base-300">
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
                <div key={label} className="px-4 py-2.5">
                  <dt className="text-xs text-base-content/60">{label}</dt>
                  <dd className="flex items-center gap-1">
                    <span className="min-w-0 flex-1">{value}</span>
                    {[c.loginName, c.email, c.externalId].some((v) => v === label) && (
                      <Copy value={value} label={`${c.copy} ${label}`} />
                    )}
                  </dd>
                </div>
              ))}
            </dl>
            <section className="rounded-box border border-base-300 bg-base-200/50 p-4">
              <h3 className="flex items-center gap-2 text-sm font-semibold">
                <KeyRound size={16} aria-hidden />
                {c.secret}
              </h3>
              <div className="mt-2 flex items-center gap-1 rounded-field bg-base-100 px-3 py-2">
                <code className="min-w-0 flex-1 font-mono text-sm whitespace-pre-wrap">
                  {secret ?? '••••••'}
                </code>
                {secret !== null && <Copy value={secret} label={`${c.copy} ${c.secret}`} />}
              </div>
              <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                <p className="text-xs text-base-content/60">{c.secretHint}</p>
                <Button
                  className="btn-sm btn-outline"
                  loading={busy}
                  onClick={() => {
                    if (secret !== null) {
                      setSecret(null)
                      sequence.current++
                    } else void reveal()
                  }}
                >
                  {secret !== null ? (
                    <EyeOff size={14} aria-hidden />
                  ) : (
                    !busy && <Eye size={14} aria-hidden />
                  )}
                  {secret !== null ? c.hide : c.reveal}
                </Button>
              </div>
              <ErrorBox error={error} />
            </section>
            <section className="rounded-box border border-base-300 p-4">
              <p className="text-sm text-base-content/70">{c.passwordHint}</p>
              <Button className="btn-sm btn-ghost -ms-2 mt-1" onClick={() => edit(a)}>
                {c.setPassword}
              </Button>
            </section>
            <Button className="btn-primary" onClick={() => edit(a)}>
              <Pencil size={16} aria-hidden />
              {c.editAccount}
            </Button>
          </div>
        )
      )}
    </Modal>
  )
}
