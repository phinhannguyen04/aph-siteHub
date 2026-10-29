'use client'
import { EditOutlined } from '@mui/icons-material'
import { Avatar, Card, CardContent, IconButton, Link, Stack, Typography } from '@mui/material'
import { Copy, localDate, TagChip } from '@/components/common'
import type { Website } from '@/lib/api/types'
import { c } from '@/lib/copy'

function avatarColor(name: string) {
  let hash = 0
  for (const char of name) hash = (hash * 31 + char.charCodeAt(0)) | 0
  return `hsl(${(hash >>> 0) % 360} 30% 32%)`
}
export function WebsiteCard({
  website,
  onEdit,
}: {
  website: Website
  onEdit: (website: Website) => void
}) {
  return (
    <Card sx={{ display: 'flex' }}>
      <CardContent
        sx={{
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          gap: 2,
          minWidth: 0,
        }}
      >
        <Stack direction="row" sx={{ gap: 1.5, alignItems: 'center' }}>
          <Avatar
            variant="rounded"
            sx={{ bgcolor: avatarColor(website.name), color: '#fff', width: 36, height: 36 }}
          >
            {website.name.trim().slice(0, 1).toUpperCase()}
          </Avatar>
          <Typography variant="h6" sx={{ flex: 1, minWidth: 0 }}>
            {website.name}
          </Typography>
          <IconButton aria-label={`${c.edit} ${website.name}`} onClick={() => onEdit(website)}>
            <EditOutlined fontSize="small" />
          </IconButton>
        </Stack>
        <Stack direction="row" sx={{ alignItems: 'center', gap: 1 }}>
          <Link
            href={website.url}
            target="_blank"
            rel="noopener noreferrer"
            sx={{ fontSize: 14, flex: 1, minWidth: 0 }}
          >
            {website.url}
          </Link>
          <Copy value={website.url} label={c.copyUrl} />
        </Stack>
        <Stack direction="row" sx={{ flexWrap: 'wrap', gap: 0.75 }}>
          {website.tags.map((tag) => (
            <TagChip key={tag.id} tag={tag} />
          ))}
        </Stack>
        <Typography variant="caption" color="text.secondary" sx={{ mt: 'auto' }}>
          {c.updated} {localDate(website.updated_at)}
        </Typography>
      </CardContent>
    </Card>
  )
}
