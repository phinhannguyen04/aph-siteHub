import { Confirm } from '@/components/ui'
import { useWrite } from '@/hooks/use-write'
import { deleteWebsite } from '@/lib/api'
import { c } from '@/lib/copy'

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
