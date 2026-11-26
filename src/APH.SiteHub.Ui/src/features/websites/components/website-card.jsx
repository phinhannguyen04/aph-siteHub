import { ExternalLink, Pencil, Trash2 } from 'lucide-react'
import { Button, CopyButton, TagChip } from '@/components/ui'
import { buttonVariants } from '@/components/ui/button'
import { c } from '@/lib/copy'

function hostOf(url) {
  try {
    return new URL(url).host
  } catch {
    return url
  }
}

export function WebsiteCard({ website, onEdit, onDelete }) {
  return (
    <article className="card site">
      <div className="site-top">
        <span className="site-icon" aria-hidden>
          {website.name.trim().charAt(0).toUpperCase() || '?'}
        </span>
        <div style={{ minWidth: 0 }}>
          <h2 className="site-name">{website.name}</h2>
          <a className="site-host" href={website.url} target="_blank" rel="noopener noreferrer">
            {hostOf(website.url)}
          </a>
        </div>
      </div>
      {website.tags.length > 0 && (
        <div className="chips">
          {website.tags.map((t) => (
            <TagChip key={t.id} tag={t} />
          ))}
        </div>
      )}
      <div className="site-foot">
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
        <div className="row-actions">
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
