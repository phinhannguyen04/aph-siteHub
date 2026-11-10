'use client'
import { X } from 'lucide-react'
import type { Tag } from '@/lib/api/types'
import { c } from '@/lib/copy'

export function tagTextColor(color: string) {
  const rgb = color
    .slice(1)
    .match(/../g)
    ?.map((v) => {
      const s = Number.parseInt(v, 16) / 255
      return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4
    }) ?? [0, 0, 0]
  const l = 0.2126 * rgb[0] + 0.7152 * rgb[1] + 0.0722 * rgb[2]
  return l > 0.179 ? '#000' : '#fff'
}

export function TagChip({ tag, onDelete }: { tag: Tag; onDelete?: () => void }) {
  return (
    <span
      className="badge badge-sm h-auto min-h-5 max-w-full gap-1 border-0 py-0.5 font-medium"
      style={{ backgroundColor: tag.color, color: tagTextColor(tag.color) }}
    >
      <span className="truncate">{tag.name}</span>
      {onDelete && (
        <button
          type="button"
          className="-me-1 rounded-full p-0.5 opacity-80 hover:opacity-100"
          aria-label={c.remove(tag.name)}
          onClick={onDelete}
        >
          <X size={12} />
        </button>
      )}
    </span>
  )
}
