import { Confirm } from '@/components/ui'
import { useWrite } from '@/hooks/use-write'
import { deleteAccount } from '@/lib/api'
import { c } from '@/lib/copy'

export function DeleteAccountDialog({ account, onClose, onDeleted }) {
  const write = useWrite(['accounts', 'stats'])
  return (
    <Confirm
      title={c.deleteAccount}
      body={`${account.provider} / ${account.login_name}: ${c.irreversible}`}
      requireText={account.login_name}
      action={c.delete}
      pending={write.pending}
      error={write.error}
      onClose={onClose}
      onConfirm={() => void write.runDelete(() => deleteAccount(account.id), onDeleted)}
    />
  )
}
