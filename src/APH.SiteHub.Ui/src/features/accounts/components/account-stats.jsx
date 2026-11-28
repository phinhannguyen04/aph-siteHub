import { card, ErrorBox, help } from '@/components/ui'
import { c } from '@/lib/copy'
import { cn } from '@/lib/utils'

const stat = cn(card, 'flex flex-col gap-0.5 px-4 py-3')
const statLabel = 'text-xs font-semibold tracking-[0.05em] text-subtle uppercase'
const statValue = 'text-xl leading-[1.3] font-semibold text-ink'

export function AccountStats({ stats }) {
  if (stats.error) return <ErrorBox error={stats.error} retry={() => void stats.refetch()} />
  const s = stats.data?.stats
  const share = s && s.total > 0 ? (s.limited / s.total) * 100 : 0
  return (
    <div className="grid grid-cols-[repeat(auto-fit,minmax(140px,1fr))] gap-3" aria-live="polite">
      <div className={stat}>
        <span className={statLabel}>{c.total}</span>
        <b className={statValue}>{s?.total ?? '–'}</b>
        <div className="mt-1.5 flex h-1 overflow-hidden rounded-md bg-[var(--ok-soft)]" aria-hidden>
          <i className="bg-[var(--warn)]" style={{ width: `${share}%` }} />
        </div>
      </div>
      <div className={stat}>
        <span className={statLabel}>{c.unlimited}</span>
        <b className={statValue}>{s?.unlimited ?? '–'}</b>
      </div>
      <div className={stat}>
        <span className={statLabel}>{c.limited}</span>
        <b className={statValue}>{s?.limited ?? '–'}</b>
      </div>
      {s?.providers.map((p) => (
        <div key={p.provider} className={stat}>
          <span className={statLabel}>{p.provider}</span>
          <b className={statValue}>{p.total}</b>
          <span className={help}>
            {' '}
            {p.limited} {c.limited.toLowerCase()}
          </span>
        </div>
      ))}
    </div>
  )
}
