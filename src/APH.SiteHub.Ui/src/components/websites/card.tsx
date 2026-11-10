'use client'
import { ExternalLink, Pencil, Trash2 } from 'lucide-react'
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
  onDelete,
}: {
  website: Website
  onEdit: (website: Website) => void
  onDelete: (website: Website) => void
}) {
  return (
    <article className="card card-border group border-base-300 bg-base-100 transition-shadow hover:shadow-md">
      <div className="card-body gap-3 p-5">
        <div className="flex items-center gap-3">
          <div className="avatar avatar-placeholder">
            <div
              className="w-10 rounded-lg text-white"
              style={{ backgroundColor: avatarColor(website.name) }}
            >
              <span className="font-semibold">{website.name.trim().slice(0, 1).toUpperCase()}</span>
            </div>
          </div>
          <h2 className="card-title min-w-0 flex-1 text-base leading-snug">{website.name}</h2>
          <div className="flex opacity-80 group-hover:opacity-100">
            <button
              type="button"
              className="btn btn-ghost btn-sm btn-square"
              aria-label={`${c.edit} ${website.name}`}
              onClick={() => onEdit(website)}
            >
              <Pencil size={16} />
            </button>
            <button
              type="button"
              className="btn btn-ghost btn-sm btn-square text-error"
              aria-label={`${c.delete} ${website.name}`}
              onClick={() => onDelete(website)}
            >
              <Trash2 size={16} />
            </button>
          </div>
        </div>
        <div className="flex items-center gap-1 rounded-field bg-base-200 px-2.5 py-1.5">
          <a
            href={website.url}
            target="_blank"
            rel="noopener noreferrer"
            className="link link-hover link-primary min-w-0 flex-1 truncate text-sm"
          >
            {website.url}
          </a>
          <ExternalLink size={14} className="shrink-0 opacity-50" aria-hidden />
          <Copy value={website.url} label={c.copyUrl} />
        </div>
        {website.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {website.tags.map((tag) => (
              <TagChip key={tag.id} tag={tag} />
            ))}
          </div>
        )}
        <p className="mt-auto pt-1 text-xs text-base-content/60">
          {c.updated} {localDate(website.updated_at)}
        </p>
      </div>
    </article>
  )
}
