'use client'
import type { UseQueryResult } from '@tanstack/react-query'
import { CircleCheck, CircleGauge, Users } from 'lucide-react'
import { ErrorBox, Progress } from '@/components/common'
import type { AccountStats } from '@/lib/api/types'
import { c } from '@/lib/copy'
export function AccountStatsPanel({ stats }: { stats: UseQueryResult<{ stats: AccountStats }> }) {
  return (
    <>
      <ErrorBox error={stats.error} retry={() => void stats.refetch()} />
      {stats.isPending ? (
        <Progress label={c.loading} />
      ) : (
        stats.data && (
          <>
            <div className="grid w-full grid-cols-1 divide-y divide-base-300 overflow-hidden rounded-box border border-base-300 bg-base-100 sm:grid-cols-3 sm:divide-x sm:divide-y-0">
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
                <div key={item.label} className="flex items-center justify-between gap-4 px-6 py-4">
                  <div>
                    <div className="text-sm text-base-content/60">{item.label}</div>
                    <p className="text-3xl font-extrabold tabular-nums">{item.value}</p>
                  </div>
                  <div className={item.tone}>
                    <item.icon size={26} aria-hidden />
                  </div>
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
                      <Progress
                        className="my-2"
                        tone="warning"
                        value={p.total ? (p.limited / p.total) * 100 : 0}
                        max={100}
                        label={`${p.provider}: ${p.limited} ${c.limited}, ${p.unlimited} ${c.unlimited}`}
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
