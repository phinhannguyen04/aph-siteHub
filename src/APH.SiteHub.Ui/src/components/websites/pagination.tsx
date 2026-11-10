'use client'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import type { websiteFilters } from '@/lib/api/websites'
import { c } from '@/lib/copy'
import { cx } from '@/lib/cx'

type Filters = ReturnType<typeof websiteFilters>

function pages(current: number, count: number): (number | 'gap')[] {
  const wanted = new Set([1, count, current - 1, current, current + 1])
  const list = [...wanted].filter((n) => n >= 1 && n <= count).sort((a, b) => a - b)
  return list.flatMap((n, i) => (i > 0 && n - list[i - 1] > 1 ? ['gap' as const, n] : [n]))
}

export function WebsitePagination({
  total,
  filters,
  update,
}: {
  total: number
  filters: Filters
  update: (v: Partial<Filters>) => void
}) {
  const count = Math.max(1, Math.ceil(total / filters.pageSize))
  return (
    <div className="flex flex-col items-center gap-3 sm:flex-row sm:flex-wrap">
      <p className="text-sm text-base-content/70 sm:me-auto">
        {c.showing(
          (filters.page - 1) * filters.pageSize + 1,
          Math.min(filters.page * filters.pageSize, total),
          total,
        )}
      </p>
      <nav aria-label={c.pagination} className="join">
        <button
          type="button"
          className="join-item btn btn-sm"
          aria-label={c.previousPage}
          disabled={filters.page <= 1}
          onClick={() => update({ page: filters.page - 1 })}
        >
          <ChevronLeft size={16} />
        </button>
        {pages(filters.page, count).map((p, i) =>
          p === 'gap' ? (
            // biome-ignore lint/suspicious/noArrayIndexKey: gaps have no identity
            <span key={`gap-${i}`} className="join-item btn btn-sm btn-disabled">
              …
            </span>
          ) : (
            <button
              key={p}
              type="button"
              className={cx(
                'join-item btn btn-sm tabular-nums',
                p === filters.page && 'btn-primary',
              )}
              aria-label={c.goToPage(p)}
              aria-current={p === filters.page ? 'page' : undefined}
              onClick={() => update({ page: p })}
            >
              {p}
            </button>
          ),
        )}
        <button
          type="button"
          className="join-item btn btn-sm"
          aria-label={c.nextPage}
          disabled={filters.page >= count}
          onClick={() => update({ page: filters.page + 1 })}
        >
          <ChevronRight size={16} />
        </button>
      </nav>
      <label className="flex items-center gap-2 text-sm text-base-content/70">
        {c.pageSize}
        <select
          className="select select-sm w-20"
          value={filters.pageSize}
          onChange={(e) => update({ pageSize: Number(e.target.value), page: 1 })}
        >
          {[12, 24, 48].map((n) => (
            <option key={n} value={n}>
              {n}
            </option>
          ))}
        </select>
      </label>
    </div>
  )
}
