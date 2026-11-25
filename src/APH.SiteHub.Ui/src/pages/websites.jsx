import { useQuery } from '@tanstack/react-query'
import { ExternalLink, Pencil, Plus, Trash2 } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { useSearchParams } from 'react-router'
import { PageHead } from '@/components/shell'
import { Button, CopyButton, Empty, ErrorBox, SearchBox, Select, TagChip } from '@/components/ui'
import { DeleteWebsiteDialog } from '@/features/delete-dialogs'
import { WebsiteForm } from '@/features/website-form'
import { query, websiteFilters, websiteSearch } from '@/lib/api'
import { c } from '@/lib/copy'
import { useTags } from '@/lib/hooks'

function hostOf(url) {
  try {
    return new URL(url).host
  } catch {
    return url
  }
}

function WebsiteCard({ website, onEdit, onDelete }) {
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
          className="btn btn-sm"
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

function pageList(page, last) {
  const pages = new Set([1, last, page - 1, page, page + 1])
  return [...pages].filter((n) => n >= 1 && n <= last).sort((a, b) => a - b)
}

function Pagination({ total, filters, update }) {
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
        onChange={(e) => update({ pageSize: Number(e.target.value), page: 1 })}
      >
        {[12, 24, 48].map((n) => (
          <option key={n} value={n}>
            {n} / page
          </option>
        ))}
      </Select>
    </div>
  )
}

export function Websites() {
  const [params, setParams] = useSearchParams()
  const filters = websiteFilters(params)
  const searchKey = websiteSearch(filters)
  const [search, setSearch] = useState(filters.search)
  const [form, setForm] = useState(null)
  const [deleting, setDeleting] = useState(null)
  const tags = useTags()
  const data = useQuery({
    queryKey: ['websites', searchKey],
    queryFn: () => query(`/api/websites?${searchKey}`),
  })

  // Filters live in the URL; replace (not push) so typing and paging do not fill the history.
  const replaceFilters = useCallback(
    (next) =>
      setParams(new URLSearchParams(websiteSearch(next)), {
        replace: true,
        preventScrollReset: true,
      }),
    [setParams],
  )
  const update = (patch) => replaceFilters({ ...filters, ...patch })

  useEffect(() => setSearch(filters.search), [filters.search])
  useEffect(() => {
    const timer = setTimeout(() => {
      if (search.trim() !== filters.search) {
        replaceFilters({
          ...websiteFilters(new URLSearchParams(searchKey)),
          search: search.trim(),
          page: 1,
        })
      }
    }, 300)
    return () => clearTimeout(timer)
  }, [search, filters.search, searchKey, replaceFilters])
  // A deleted last page (or a shrunken result set) falls back to the new last page.
  useEffect(() => {
    if (
      data.data &&
      data.data.total > 0 &&
      filters.page > Math.ceil(data.data.total / filters.pageSize)
    ) {
      const next = websiteFilters(new URLSearchParams(searchKey))
      replaceFilters({ ...next, page: Math.ceil(data.data.total / next.pageSize) })
    }
  }, [data.data, filters.page, filters.pageSize, searchKey, replaceFilters])

  const filtered = !!filters.search || filters.tagIds.length > 0
  const clear = () => {
    setSearch('')
    update({ search: '', tagIds: [], page: 1 })
  }
  const toggleTag = (id) =>
    update({
      tagIds: filters.tagIds.includes(id)
        ? filters.tagIds.filter((t) => t !== id)
        : [...filters.tagIds, id],
      page: 1,
    })

  return (
    <>
      <PageHead title={c.websites} intro={c.websiteIntro}>
        <Button variant="primary" onClick={() => setForm('new')}>
          <Plus size={16} aria-hidden />
          {c.addWebsite}
        </Button>
      </PageHead>
      <div className="toolbar">
        <SearchBox label={c.searchWebsites} value={search} onChange={setSearch} />
        {filtered && (
          <Button variant="ghost" size="sm" onClick={clear}>
            {c.clear}
          </Button>
        )}
      </div>
      {tags.data?.tags.length > 0 && (
        <fieldset className="chips">
          <legend className="sr-only">{c.filterTags}</legend>
          {tags.data.tags.map((t) => (
            <TagChip
              key={t.id}
              tag={t}
              pressed={filters.tagIds.includes(t.id)}
              onClick={() => toggleTag(t.id)}
            />
          ))}
        </fieldset>
      )}
      <ErrorBox error={tags.error} retry={() => void tags.refetch()} />
      <ErrorBox error={data.error} retry={() => void data.refetch()} />
      {data.isPending ? (
        <div className="grid">
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <div key={n} className="skeleton" />
          ))}
        </div>
      ) : data.data?.websites.length === 0 ? (
        <Empty
          title={filtered ? c.noResults : c.noWebsites}
          body={filtered ? c.noResultsBody : c.noWebsitesBody}
          action={
            <Button variant="primary" onClick={filtered ? clear : () => setForm('new')}>
              {filtered ? c.clear : c.addWebsite}
            </Button>
          }
        />
      ) : (
        <div className="grid">
          {data.data?.websites.map((website) => (
            <WebsiteCard
              key={website.id}
              website={website}
              onEdit={setForm}
              onDelete={setDeleting}
            />
          ))}
        </div>
      )}
      {data.data && data.data.total > 0 && (
        <Pagination total={data.data.total} filters={filters} update={update} />
      )}
      {form && (
        <WebsiteForm website={form === 'new' ? undefined : form} onClose={() => setForm(null)} />
      )}
      {deleting && (
        <DeleteWebsiteDialog
          website={deleting}
          onClose={() => setDeleting(null)}
          onDeleted={() => {
            if (data.data && data.data.websites.length <= 1 && filters.page > 1)
              update({ page: filters.page - 1 })
            setDeleting(null)
          }}
        />
      )}
    </>
  )
}
