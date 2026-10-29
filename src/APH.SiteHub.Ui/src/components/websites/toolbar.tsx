'use client'
import { Add } from '@mui/icons-material'
import { Autocomplete, Button, Stack, TextField } from '@mui/material'
import { TagChip } from '@/components/common'
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
    <Stack direction={{ xs: 'column', lg: 'row' }} sx={{ gap: 2 }}>
      <TextField
        label={c.searchWebsites}
        value={search}
        onChange={(e) => setSearch(e.target.value.slice(0, 160))}
        sx={{ flex: 1 }}
      />
      <Autocomplete
        multiple
        options={tags}
        value={filters.tagIds
          .map((id) => tags.find((t) => t.id === id))
          .filter((t) => t !== undefined)}
        isOptionEqualToValue={(a, b) => a.id === b.id}
        getOptionLabel={(t) => t.name}
        onChange={(_, values) => update({ tagIds: values.map((t) => t.id), page: 1 })}
        renderInput={(p) => <TextField {...p} label={c.filterTags} />}
        renderValue={(values) => (
          <Stack direction="row" sx={{ flexWrap: 'wrap', gap: 0.5 }}>
            {values.map((t) => (
              <TagChip
                key={t.id}
                tag={t}
                onDelete={() =>
                  update({ tagIds: filters.tagIds.filter((id) => id !== t.id), page: 1 })
                }
              />
            ))}
          </Stack>
        )}
        sx={{ flex: 1 }}
      />
      <Button
        variant="contained"
        startIcon={<Add />}
        onClick={() => onAdd()}
        sx={{ flexShrink: 0 }}
      >
        {c.addWebsite}
      </Button>
    </Stack>
  )
}
