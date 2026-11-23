import { useQuery } from '@tanstack/react-query'
import { useNavigate, useRouterState } from '@tanstack/react-router'
import { useCallback, useEffect, useState } from 'react'
import { Button, Empty, ErrorBox } from '@/components/common'
import { PageHeader } from '@/components/layout/page-header'
import { WebsiteForm } from '@/components/websites/form'
import { query } from '@/lib/api/client'
import { useTags } from '@/lib/api/hooks'
import type { Website, WebsitePage } from '@/lib/api/types'
import { websiteFilters, websiteSearch } from '@/lib/api/websites'
import { c } from '@/lib/copy'
import { WebsiteCard } from './card'
import { DeleteWebsiteDialog } from './delete-dialog'
import { WebsitePagination } from './pagination'
import { WebsiteToolbar } from './toolbar'
export function Websites() {
  const navigate = useNavigate()
  const searchText = useRouterState({ select: (state) => state.location.searchStr })
  const filters = websiteFilters(new URLSearchParams(searchText))
  const searchKey = websiteSearch(filters)
  const [search, setSearch] = useState(filters.search)
  const [form, setForm] = useState<Website | 'new' | null>(null)
  const [deleting, setDeleting] = useState<Website | null>(null)
  const tags = useTags()
  const data = useQuery({
    queryKey: ['websites', searchKey],
    queryFn: () => query<WebsitePage>(`/api/websites?${searchKey}`),
  })
  // Filters live in the URL (replace, not push, so typing and paging do not fill the history).
  const replaceFilters = useCallback(
    (next: ReturnType<typeof websiteFilters>) =>
      void navigate({
        to: '/',
        search: Object.fromEntries(new URLSearchParams(websiteSearch(next))),
        replace: true,
        resetScroll: false,
      }),
    [navigate],
  )
  const update = (patch: Partial<typeof filters>) => replaceFilters({ ...filters, ...patch })
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
  const grid = 'grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3'
  return (
    <div className="flex flex-col gap-6">
      <PageHeader title={c.websites} intro={c.websiteIntro} />
      <WebsiteToolbar
        search={search}
        setSearch={setSearch}
        filters={filters}
        tags={tags.data?.tags ?? []}
        update={update}
        onAdd={() => setForm('new')}
      />
      <ErrorBox error={tags.error} retry={() => void tags.refetch()} />
      <ErrorBox error={data.error} retry={() => void data.refetch()} />
      {data.isPending ? (
        <div className={grid}>
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <div key={n} className="h-52 animate-pulse rounded-box bg-base-300/70" />
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
        <div className={grid}>
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
        <WebsitePagination total={data.data.total} filters={filters} update={update} />
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
    </div>
  )
}
