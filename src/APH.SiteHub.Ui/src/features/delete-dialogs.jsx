import { Confirm } from '@/components/ui'
import { deleteAccount, deleteWebsite } from '@/lib/api'
import { c } from '@/lib/copy'
import { useWrite } from '@/lib/hooks'

export function DeleteWebsiteDialog({ website, onClose, onDeleted }) {
  const write = useWrite(['websites', 'count'])
  return (
    <Confirm
      title={c.deleteWebsite}
      body={`${website.name}: ${c.irreversibleWebsite}`}
      action={c.delete}
      pending={write.pending}
      error={write.error}
      onClose={onClose}
      onConfirm={() => void write.runDelete(() => deleteWebsite(website.id), onDeleted)}
    />
  )
}

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
