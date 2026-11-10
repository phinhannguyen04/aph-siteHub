'use client'
import type { UseQueryResult } from '@tanstack/react-query'
import { CircleCheck, CircleGauge, Users } from 'lucide-react'
import { ErrorBox } from '@/components/common'
import type { AccountStats } from '@/lib/api/types'
import { c } from '@/lib/copy'
export function AccountStatsPanel({ stats }: { stats: UseQueryResult<{ stats: AccountStats }> }) {
  return (
    <>
      <ErrorBox error={stats.error} retry={() => void stats.refetch()} />
      {stats.isPending ? (
        <progress className="progress progress-primary w-full" aria-label={c.loading} />
      ) : (
        stats.data && (
          <>
            <div className="stats stats-vertical w-full border border-base-300 bg-base-100 sm:stats-horizontal">
              {[
                {
                  label: c.total,
                  value: stats.data.stats.total,
                  icon: Users,
                  tone: 'text-primary',
                },
                {
                  label: c.limited,
                  value: stats.data.stats.limited,
                  icon: CircleGauge,
                  tone: 'text-warning',
                },
                {
                  label: c.unlimited,
                  value: stats.data.stats.unlimited,
                  icon: CircleCheck,
                  tone: 'text-success',
                },
              ].map((item) => (
                <div key={item.label} className="stat">
                  <div className={`stat-figure ${item.tone}`}>
                    <item.icon size={26} aria-hidden />
                  </div>
                  <div className="stat-title">{item.label}</div>
                  <p className="stat-value tabular-nums">{item.value}</p>
                </div>
              ))}
            </div>
            {stats.data.stats.providers.length > 0 && (
              <section className="rounded-box border border-base-300 bg-base-100 p-5">
                <h2 className="mb-4 text-base font-semibold">{c.providers}</h2>
                <div className="grid grid-cols-1 gap-x-8 gap-y-5 sm:grid-cols-2 xl:grid-cols-3">
                  {stats.data.stats.providers.map((p) => (
                    <div key={p.provider}>
                      <div className="flex justify-between gap-2 text-sm">
                        <span className="font-medium">{p.provider}</span>
                        <span className="text-base-content/60">{c.count(p.total)}</span>
                      </div>
                      <progress
                        className="progress progress-warning my-2 h-1.5 w-full"
                        value={p.total ? (p.limited / p.total) * 100 : 0}
                        max={100}
                        aria-label={`${p.provider}: ${p.limited} ${c.limited}, ${p.unlimited} ${c.unlimited}`}
                      />
                      <p className="text-xs text-base-content/60">
                        {p.limited} {c.limited} · {p.unlimited} {c.unlimited}
                      </p>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </>
        )
      )}
    </>
  )
}
