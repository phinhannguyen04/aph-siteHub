import { Button, Select } from '@/components/ui'
import { c } from '@/lib/copy'

function pageList(page, last) {
  const pages = new Set([1, last, page - 1, page, page + 1])
  return [...pages].filter((n) => n >= 1 && n <= last).sort((a, b) => a - b)
}

export function Pagination({ total, filters, update }) {
  const last = Math.max(1, Math.ceil(total / filters.pageSize))
  const from = (filters.page - 1) * filters.pageSize + 1
  const to = Math.min(total, filters.page * filters.pageSize)
  const pages = pageList(filters.page, last)
  return (
    <div className="pager">
      <span className="help">{c.showing(from, to, total)}</span>
      <nav aria-label={c.pagination}>
        <Button
          size="sm"
          disabled={filters.page <= 1}
          onClick={() => update({ page: filters.page - 1 })}
        >
          {c.previousPage}
        </Button>
        {pages.map((n, i) => (
          <span key={n} className="row">
            {i > 0 && n - pages[i - 1] > 1 && <span aria-hidden>…</span>}
            <Button
              size="sm"
              aria-label={c.goToPage(n)}
              aria-current={n === filters.page ? 'page' : undefined}
              onClick={() => update({ page: n })}
            >
              {n}
            </Button>
          </span>
        ))}
        <Button
          size="sm"
          disabled={filters.page >= last}
          onClick={() => update({ page: filters.page + 1 })}
        >
          {c.nextPage}
        </Button>
      </nav>
      <Select
        label={c.pageSize}
        value={filters.pageSize}
        onValueChange={(n) => update({ pageSize: Number(n), page: 1 })}
        options={[12, 24, 48].map((n) => ({ value: n, label: `${n} / page` }))}
      />
    </div>
  )
}
