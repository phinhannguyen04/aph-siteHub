'use client'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useId } from 'react'
import { Button, buttonClass, SelectBox } from '@/components/common'
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
  const sizeId = useId()
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
      <nav
        aria-label={c.pagination}
        className="inline-flex [&>*:not(:first-child)]:-ms-px [&>*:not(:first-child)]:rounded-s-none [&>*:not(:last-child)]:rounded-e-none"
      >
        <Button
          size="sm"
          aria-label={c.previousPage}
          disabled={filters.page <= 1}
          onClick={() => update({ page: filters.page - 1 })}
        >
          <ChevronLeft size={16} />
        </Button>
        {pages(filters.page, count).map((p, i) =>
          p === 'gap' ? (
            <span
              // biome-ignore lint/suspicious/noArrayIndexKey: gaps have no identity
              key={`gap-${i}`}
              className={cx(buttonClass({ size: 'sm' }), 'cursor-not-allowed opacity-50')}
              aria-hidden
            >
              …
            </span>
          ) : (
            <Button
              key={p}
              size="sm"
              variant={p === filters.page ? 'primary' : 'default'}
              className="tabular-nums"
              aria-label={c.goToPage(p)}
              aria-current={p === filters.page ? 'page' : undefined}
              onClick={() => update({ page: p })}
            >
              {p}
            </Button>
          ),
        )}
        <Button
          size="sm"
          aria-label={c.nextPage}
          disabled={filters.page >= count}
          onClick={() => update({ page: filters.page + 1 })}
        >
          <ChevronRight size={16} />
        </Button>
      </nav>
      <div className="flex items-center gap-2 text-sm text-base-content/70">
        <label htmlFor={sizeId}>{c.pageSize}</label>
        <SelectBox
          id={sizeId}
          size="sm"
          className="w-20"
          value={filters.pageSize}
          onChange={(e) => update({ pageSize: Number(e.target.value), page: 1 })}
        >
          {[12, 24, 48].map((n) => (
            <option key={n} value={n}>
              {n}
            </option>
          ))}
        </SelectBox>
      </div>
    </div>
  )
}
