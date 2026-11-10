'use client'
import { useState } from 'react'
import { Button, ErrorBox, Field, Modal, PasswordField } from '@/components/common'
import { accountPatch } from '@/lib/api/accounts'
import { useWrite } from '@/lib/api/hooks'
import type { Account } from '@/lib/api/types'
import { c } from '@/lib/copy'
import type { AccountErrors } from '@/lib/validation'
import { account as validate } from '@/lib/validation'
export function AccountForm({ account, onClose }: { account?: Account; onClose: () => void }) {
  const [values, setValues] = useState({
    provider: account?.provider ?? '',
    login_name: account?.login_name ?? '',
    external_account_id: account?.external_account_id ?? '',
    email: account?.email ?? '',
    password: '',
    secret_key: '',
  })
  const [limit, setLimit] = useState(account?.is_limit ?? false)
  const [validation, setValidation] = useState<AccountErrors>({})
  const write = useWrite(['accounts', 'stats', 'account'])
  const fields = [
    ['provider', c.provider],
    ['login_name', c.loginName],
    ['external_account_id', c.externalId],
    ['email', c.email],
  ] as const
  const input = {
    ...values,
    provider: values.provider.trim(),
    login_name: values.login_name.trim(),
    external_account_id: values.external_account_id.trim(),
    email: values.email.trim(),
    is_limit: limit,
  }
  const patch = account ? accountPatch(account, input) : input
  return (
    <Modal
      title={account ? c.editAccount : c.addAccount}
      onClose={write.pending ? undefined : onClose}
      onSubmit={(e) => {
        e.preventDefault()
        const error = validate(values, !!account)
        setValidation(error)
        if (Object.keys(error).length) return
        void write.run(
          account ? `/api/accounts/${account.id}` : '/api/accounts',
          account ? 'PATCH' : 'POST',
          patch,
          onClose,
        )
      }}
      actions={
        <>
          <Button className="btn-ghost" onClick={onClose} disabled={write.pending}>
            {c.cancel}
          </Button>
          <Button
            className="btn-primary"
            type="submit"
            loading={write.pending}
            disabled={account && Object.keys(patch).length === 0}
          >
            {account ? c.save : c.create}
          </Button>
        </>
      }
    >
      <ErrorBox error={write.error} />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {fields.map(([key, label], i) => (
          <Field
            key={key}
            label={label}
            type={key === 'email' ? 'email' : 'text'}
            error={!!validation[key]}
            helperText={validation[key]}
            autoFocus={i === 0 && !account}
            required={!account}
            value={values[key]}
            readOnly={!!account}
            onChange={(e) => setValues((v) => ({ ...v, [key]: e.target.value }))}
          />
        ))}
      </div>
      <div className="divider my-0" />
      <PasswordField
        label={account ? c.setPassword : c.password}
        autoFocus={!!account}
        autoComplete="new-password"
        required={!account}
        error={!!validation.password}
        helperText={validation.password ?? (account ? c.unchanged : undefined)}
        value={values.password}
        onChange={(e) => setValues((v) => ({ ...v, password: e.target.value }))}
      />
      <PasswordField
        label={c.secret}
        autoComplete="off"
        required={!account}
        error={!!validation.secret_key}
        helperText={validation.secret_key ?? (account ? c.unchanged : undefined)}
        value={values.secret_key}
        onChange={(e) => setValues((v) => ({ ...v, secret_key: e.target.value }))}
      />
      <label className="flex cursor-pointer items-center gap-3 self-start">
        <input
          type="checkbox"
          className="toggle toggle-warning"
          checked={limit}
          onChange={(e) => setLimit(e.target.checked)}
        />
        <span className="text-sm font-medium">{c.limited}</span>
      </label>
    </Modal>
  )
}
