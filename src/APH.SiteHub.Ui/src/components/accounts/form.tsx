'use client'
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  Stack,
  Switch,
  TextField,
} from '@mui/material'
import { useState } from 'react'
import { ErrorBox, PasswordField } from '@/components/common'
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
    <Dialog
      open
      onClose={write.pending ? undefined : onClose}
      fullWidth
      maxWidth="sm"
      aria-labelledby="account-form-title"
    >
      <Box
        component="form"
        noValidate
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
      >
        <DialogTitle id="account-form-title">{account ? c.editAccount : c.addAccount}</DialogTitle>
        <DialogContent>
          <Stack spacing={2.5} sx={{ pt: 1 }}>
            <ErrorBox error={write.error} />
            {fields.map(([key, label], i) => (
              <TextField
                key={key}
                label={label}
                error={!!validation[key]}
                helperText={validation[key]}
                autoFocus={i === 0 && !account}
                required={!account}
                value={values[key]}
                slotProps={{ input: { readOnly: !!account } }}
                onChange={(e) => setValues((v) => ({ ...v, [key]: e.target.value }))}
              />
            ))}
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
            <FormControlLabel
              control={<Switch checked={limit} onChange={(_, value) => setLimit(value)} />}
              label={c.limited}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose} disabled={write.pending}>
            {c.cancel}
          </Button>
          <Button
            variant="contained"
            type="submit"
            loading={write.pending}
            disabled={account && Object.keys(patch).length === 0}
          >
            {account ? c.save : c.create}
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  )
}
