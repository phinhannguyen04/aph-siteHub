'use client'
import { Chip } from '@mui/material'
import type { Tag } from '@/lib/api/types'
export function TagChip({ tag, onDelete }: { tag: Tag; onDelete?: () => void }) {
  const rgb = tag.color
    .slice(1)
    .match(/../g)
    ?.map((v) => {
      const s = Number.parseInt(v, 16) / 255
      return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4
    }) ?? [0, 0, 0]
  const l = 0.2126 * rgb[0] + 0.7152 * rgb[1] + 0.0722 * rgb[2]
  return (
    <Chip
      size="small"
      label={tag.name}
      onDelete={onDelete}
      sx={{ bgcolor: tag.color, color: l > 0.179 ? '#000' : '#fff', maxWidth: '100%' }}
    />
  )
}
