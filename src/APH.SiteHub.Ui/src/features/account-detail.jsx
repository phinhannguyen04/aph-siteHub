import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Eye, EyeOff, KeyRound, Pencil } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Badge, Busy, Button, CopyButton, ErrorBox, localDate, Modal } from '@/components/ui'
import { query, request } from '@/lib/api'
import { c } from '@/lib/copy'
import { Status } from './account-status'

const copyable = new Set([c.loginName, c.email, c.externalId])

/** Side drawer. The secret key is fetched on demand, kept only in this component and wiped after 30 s. */
export function AccountDetail({ id, onClose, onEdit }) {
  const client = useQueryClient()
  const account = useQuery({
    queryKey: ['account', id],
    queryFn: () => query(`/api/accounts/${id}`),
  })
  const [secret, setSecret] = useState(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)
  const sequence = useRef(0)
  const guard = useRef(false)

  useEffect(() => {
    if (account.error?.status === 404 || error?.status === 404) {
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
    const result = await request(`/api/accounts/${id}/secret-key`)
    if (current === sequence.current) {
      if (result.ok) setSecret(result.data.secret_key)
      else setError(result.error)
      setBusy(false)
    }
    guard.current = false
  }
  const hide = () => {
    setSecret(null)
    sequence.current++
  }
  const a = account.data?.account
  return (
    <Modal title={c.details} variant="drawer" onClose={onClose}>
      <ErrorBox error={account.error} retry={() => void account.refetch()} />
      {account.isPending ? (
        <Busy />
      ) : (
        a && (
          <>
            <div className="row between">
              <Badge>{a.provider}</Badge>
              <Status account={a} />
            </div>
            <dl className="dl">
              {[
                [c.id, a.id],
                [c.provider, a.provider],
                [c.loginName, a.login_name],
                [c.email, a.email],
                [c.externalId, a.external_account_id],
                [c.createdAt, localDate(a.created_at)],
              ].map(([label, value]) => (
                <div key={label}>
                  <div className="grow">
                    <dt>{label}</dt>
                    <dd>{value}</dd>
                  </div>
                  {copyable.has(label) && <CopyButton value={value} label={`${c.copy} ${label}`} />}
                </div>
              ))}
            </dl>
            <section className="secret">
              <h3 className="row" style={{ fontSize: '0.9rem', marginBottom: '0.5rem' }}>
                <KeyRound size={16} aria-hidden />
                {c.secret}
              </h3>
              <div className="row">
                <code style={{ flex: 1 }}>{secret ?? '••••••'}</code>
                {secret !== null && <CopyButton value={secret} label={`${c.copy} ${c.secret}`} />}
              </div>
              <div className="row between" style={{ marginTop: '0.6rem' }}>
                <p className="help">{c.secretHint}</p>
                <Button
                  size="sm"
                  loading={busy}
                  onClick={secret !== null ? hide : () => void reveal()}
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
            <p className="help">{c.passwordHint}</p>
            <Button
              variant="primary"
              onClick={() => {
                hide()
                onEdit(a)
              }}
            >
              <Pencil size={16} aria-hidden />
              {c.editAccount}
            </Button>
          </>
        )
      )}
    </Modal>
  )
}
