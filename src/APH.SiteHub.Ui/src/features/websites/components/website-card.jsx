import { ExternalLink, Pencil, Trash2 } from 'lucide-react'
import { Button, CopyButton, card, chipsClass, rowActions, TagChip } from '@/components/ui'
import { buttonVariants } from '@/components/ui/button'
import { c } from '@/lib/copy'
import { cn } from '@/lib/utils'

function hostOf(url) {
  try {
    return new URL(url).host
  } catch {
    return url
  }
}

export function WebsiteCard({ website, onEdit, onDelete }) {
  return (
    <article
      className={cn(
        card,
        'flex flex-col gap-3 p-4 transition-colors duration-200 hover:border-input',
      )}
    >
      <div className="flex items-center gap-3">
        <span
          className="grid size-8 shrink-0 place-items-center rounded-md bg-secondary text-lg font-semibold text-primary"
          aria-hidden
        >
          {website.name.trim().charAt(0).toUpperCase() || '?'}
        </span>
        <div style={{ minWidth: 0 }}>
          <h2 className="text-base font-semibold text-ink wrap-anywhere">{website.name}</h2>
          <a
            className="block text-subtle no-underline wrap-anywhere hover:text-primary hover:underline"
            href={website.url}
            target="_blank"
            rel="noopener noreferrer"
          >
            {hostOf(website.url)}
          </a>
        </div>
      </div>
      {website.tags.length > 0 && (
        <div className={chipsClass}>
          {website.tags.map((t) => (
            <TagChip key={t.id} tag={t} />
          ))}
        </div>
      )}
      <div className="mt-auto flex items-center justify-between gap-2">
        <a
          className={buttonVariants({ variant: 'outline', size: 'sm' })}
          href={website.url}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`${c.openSite}: ${website.name}`}
        >
          <ExternalLink size={14} aria-hidden />
          {c.openSite}
        </a>
        <div className={rowActions}>
          <CopyButton value={website.url} label={`${c.copyUrl}: ${website.name}`} />
          <Button
            variant="ghost"
            size="sm"
            icon
            aria-label={`${c.edit}: ${website.name}`}
            onClick={() => onEdit(website)}
          >
            <Pencil size={15} />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            icon
            aria-label={`${c.delete}: ${website.name}`}
            onClick={() => onDelete(website)}
          >
            <Trash2 size={15} />
          </Button>
        </div>
      </div>
    </article>
  )
}
