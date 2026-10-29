'use client'
import {
  FormControl,
  InputLabel,
  MenuItem,
  Pagination,
  Select,
  Stack,
  Typography,
} from '@mui/material'
import type { websiteFilters } from '@/lib/api/websites'
import { c } from '@/lib/copy'

type Filters = ReturnType<typeof websiteFilters>
export function WebsitePagination({
  total,
  filters,
  update,
}: {
  total: number
  filters: Filters
  update: (v: Partial<Filters>) => void
}) {
  return (
    <Stack
      direction={{ xs: 'column', sm: 'row' }}
      sx={{ alignItems: 'center', gap: 2, flexWrap: 'wrap' }}
    >
      <Typography variant="body2" color="text.secondary" sx={{ mr: 'auto' }}>
        {c.showing(
          (filters.page - 1) * filters.pageSize + 1,
          Math.min(filters.page * filters.pageSize, total),
          total,
        )}
      </Typography>
      <Pagination
        count={Math.ceil(total / filters.pageSize)}
        page={filters.page}
        onChange={(_, page) => update({ page })}
        size="small"
        siblingCount={0}
      />
      <FormControl size="small" sx={{ minWidth: 100 }}>
        <InputLabel id="page-size">{c.pageSize}</InputLabel>
        <Select
          labelId="page-size"
          label={c.pageSize}
          value={filters.pageSize}
          onChange={(e) => update({ pageSize: Number(e.target.value), page: 1 })}
        >
          {[12, 24, 48].map((n) => (
            <MenuItem key={n} value={n}>
              {n}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
    </Stack>
  )
}
