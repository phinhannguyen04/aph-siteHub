'use client'
import { Confirm, ErrorBox } from '@/components/common'
import { useWrite } from '@/lib/api/hooks'
import type { Website } from '@/lib/api/types'
import { deleteWebsite } from '@/lib/api/websites'
import { c } from '@/lib/copy'

export function DeleteWebsiteDialog({
  website,
  onClose,
  onDeleted,
}: {
  website: Website
  onClose: () => void
  onDeleted: () => void
}) {
  const write = useWrite(['websites', 'count'])
  return (
    <Confirm
      title={c.deleteWebsite}
      pending={write.pending}
      onClose={onClose}
      onConfirm={() => void write.runDelete(() => deleteWebsite(website.id), onDeleted)}
    >
      <p className="text-base-content/80">{c.irreversibleWebsite}</p>
      <p className="rounded-field bg-base-200 px-3 py-2 font-semibold">{website.name}</p>
      <ErrorBox error={write.error} />
    </Confirm>
  )
}
