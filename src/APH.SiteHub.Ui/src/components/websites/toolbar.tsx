'use client'
import { Plus, Search } from 'lucide-react'
import { Button, Field, TagSelect } from '@/components/common'
import type { Tag } from '@/lib/api/types'
import type { websiteFilters } from '@/lib/api/websites'
import { c } from '@/lib/copy'

type Filters = ReturnType<typeof websiteFilters>
export function WebsiteToolbar({
  search,
  setSearch,
  filters,
  tags,
  update,
  onAdd,
}: {
  search: string
  setSearch: (v: string) => void
  filters: Filters
  tags: Tag[]
  update: (v: Partial<Filters>) => void
  onAdd: () => void
}) {
  return (
    <div className="flex flex-col gap-3 rounded-box border border-base-300 bg-base-100 p-4 lg:flex-row lg:items-end">
      <Field
        type="search"
        label={c.searchWebsites}
        value={search}
        onChange={(e) => setSearch(e.target.value.slice(0, 160))}
        className="flex-1"
        start={<Search size={16} className="opacity-50" aria-hidden />}
      />
      <TagSelect
        label={c.filterTags}
        tags={tags}
        value={filters.tagIds
          .map((id) => tags.find((t) => t.id === id))
          .filter((t) => t !== undefined)}
        onChange={(values) => update({ tagIds: values.map((t) => t.id), page: 1 })}
        className="flex-1"
      />
      <Button className="btn-primary shrink-0" onClick={() => onAdd()}>
        <Plus size={16} aria-hidden />
        {c.addWebsite}
      </Button>
    </div>
  )
}
