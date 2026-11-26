import { useQuery } from '@tanstack/react-query'
import { Plus } from 'lucide-react'
import { useState } from 'react'
import { PageHead } from '@/components/layout/page-head'
import { Button, Empty, ErrorBox, SearchBox } from '@/components/ui'
import { TagFilter, useTags } from '@/features/tags'
import {
  DeleteWebsiteDialog,
  Pagination,
  useClampPage,
  useWebsiteFilters,
  WebsiteCard,
  WebsiteForm,
} from '@/features/websites'
import { query } from '@/lib/api'
import { c } from '@/lib/copy'

export function Websites() {
  const [form, setForm] = useState(null)
  const [deleting, setDeleting] = useState(null)
  const tags = useTags()
  const f = useWebsiteFilters()
  const { filters, filtered, update } = f
  const data = useQuery({
    queryKey: ['websites', f.searchKey],
    queryFn: () => query(`/api/websites?${f.searchKey}`),
  })
  const dataTotal = data.data?.total ?? 0
  useClampPage(dataTotal, f)

  // Sits at the end of the tag row; falls back to the toolbar when there are no tags to show.
  const hasTags = !!tags.data?.tags.length
  const clearButton = (
    <Button variant="ghost" size="sm" onClick={f.clear}>
      {c.clear}
    </Button>
  )

  return (
    <>
      <PageHead title={c.websites} intro={c.websiteIntro}>
        <Button variant="primary" onClick={() => setForm('new')}>
          <Plus size={16} aria-hidden />
          {c.addWebsite}
        </Button>
      </PageHead>
      <div className="toolbar">
        <SearchBox label={c.searchWebsites} value={f.search} onChange={f.setSearch} />
        {filtered && !hasTags && clearButton}
      </div>
      <TagFilter tags={tags.data?.tags} selectedIds={filters.tagIds} onToggle={f.toggleTag}>
        {filtered && clearButton}
      </TagFilter>
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
            <Button variant="primary" onClick={filtered ? f.clear : () => setForm('new')}>
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
      {dataTotal > 0 && <Pagination total={dataTotal} filters={filters} update={update} />}
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
