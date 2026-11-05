'use client'
import { Typography } from '@mui/material'
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
      <Typography>{c.irreversibleWebsite}</Typography>
      <Typography sx={{ fontWeight: 700 }}>{website.name}</Typography>
      <ErrorBox error={write.error} />
    </Confirm>
  )
}
