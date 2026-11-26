import { ErrorBox } from '@/components/ui'
import { c } from '@/lib/copy'

export function AccountStats({ stats }) {
  if (stats.error) return <ErrorBox error={stats.error} retry={() => void stats.refetch()} />
  const s = stats.data?.stats
  const share = s && s.total > 0 ? (s.limited / s.total) * 100 : 0
  return (
    <div className="stats" aria-live="polite">
      <div className="card stat">
        <span>{c.total}</span>
        <b>{s?.total ?? '–'}</b>
        <div className="bar" aria-hidden>
          <i style={{ width: `${share}%` }} />
        </div>
      </div>
      <div className="card stat">
        <span>{c.unlimited}</span>
        <b>{s?.unlimited ?? '–'}</b>
      </div>
      <div className="card stat">
        <span>{c.limited}</span>
        <b>{s?.limited ?? '–'}</b>
      </div>
      {s?.providers.map((p) => (
        <div key={p.provider} className="card stat">
          <span>{p.provider}</span>
          <b>{p.total}</b>
          <span className="help">
            {' '}
            {p.limited} {c.limited.toLowerCase()}
          </span>
        </div>
      ))}
    </div>
  )
}
