import { useState } from 'react'
import { Button, ErrorBox, Field, Modal, PasswordField, SwitchField } from '@/components/ui'
import { accountPatch } from '@/lib/api'
import { c } from '@/lib/copy'
import { useWrite } from '@/lib/hooks'
import { account as validate } from '@/lib/validation'

const fields = [
  ['provider', c.provider],
  ['login_name', c.loginName],
  ['external_account_id', c.externalId],
  ['email', c.email],
]

export function AccountForm({ account, onClose }) {
  const [values, setValues] = useState({
    provider: account?.provider ?? '',
    login_name: account?.login_name ?? '',
    external_account_id: account?.external_account_id ?? '',
    email: account?.email ?? '',
    password: '',
    secret_key: '',
  })
  const [limit, setLimit] = useState(account?.is_limit ?? false)
  const [validation, setValidation] = useState({})
  const write = useWrite(['accounts', 'stats', 'account'])
  const input = {
    ...values,
    provider: values.provider.trim(),
    login_name: values.login_name.trim(),
    external_account_id: values.external_account_id.trim(),
    email: values.email.trim(),
    is_limit: limit,
  }
  const patch = account ? accountPatch(account, input) : input
  const set = (key) => (e) => setValues((v) => ({ ...v, [key]: e.target.value }))
  return (
    <Modal
      title={account ? c.editAccount : c.addAccount}
      variant="wide"
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
          <Button variant="ghost" onClick={onClose} disabled={write.pending}>
            {c.cancel}
          </Button>
          <Button
            variant="primary"
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
      <div className="two">
        {fields.map(([key, label], i) => (
          <Field
            key={key}
            label={label}
            type={key === 'email' ? 'email' : 'text'}
            error={!!validation[key]}
            helperText={validation[key]}
            autoFocus={i === 0 && !account}
            required={!account}
            readOnly={!!account}
            value={values[key]}
            onChange={set(key)}
          />
        ))}
      </div>
      <PasswordField
        label={account ? c.setPassword : c.password}
        autoFocus={!!account}
        autoComplete="new-password"
        required={!account}
        error={!!validation.password}
        helperText={validation.password ?? (account ? c.unchanged : undefined)}
        value={values.password}
        onChange={set('password')}
      />
      <PasswordField
        label={c.secret}
        autoComplete="off"
        required={!account}
        error={!!validation.secret_key}
        helperText={validation.secret_key ?? (account ? c.unchanged : undefined)}
        value={values.secret_key}
        onChange={set('secret_key')}
      />
      <SwitchField label={c.limited} checked={limit} onChange={setLimit} />
    </Modal>
  )
}
