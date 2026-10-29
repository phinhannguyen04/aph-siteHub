'use client'
import { Box, Button, Skeleton, Stack, Typography } from '@mui/material'
import { useQuery } from '@tanstack/react-query'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Empty, ErrorBox } from '@/components/common'
import { WebsiteForm } from '@/components/websites/form'
import { query } from '@/lib/api/client'
import { useTags } from '@/lib/api/hooks'
import type { Website, WebsitePage } from '@/lib/api/types'
import { websiteFilters, websiteSearch } from '@/lib/api/websites'
import { c } from '@/lib/copy'
import { WebsiteCard } from './card'
import { WebsitePagination } from './pagination'
import { WebsiteToolbar } from './toolbar'
export function Websites() {
  const params = useSearchParams()
  const router = useRouter()
  const path = usePathname()
  const filters = websiteFilters(new URLSearchParams(params.toString()))
  const searchKey = websiteSearch(filters)
  const [search, setSearch] = useState(filters.search)
  const [form, setForm] = useState<Website | 'new' | null>(null)
  const tags = useTags()
  const data = useQuery({
    queryKey: ['websites', searchKey],
    queryFn: () => query<WebsitePage>(`/api/websites?${searchKey}`),
  })
  const update = (patch: Partial<typeof filters>) =>
    router.replace(`${path}?${websiteSearch({ ...filters, ...patch })}`, { scroll: false })
  useEffect(() => setSearch(filters.search), [filters.search])
  useEffect(() => {
    const timer = setTimeout(() => {
      if (search.trim() !== filters.search) {
        const next = websiteFilters(new URLSearchParams(searchKey))
        router.replace(`${path}?${websiteSearch({ ...next, search: search.trim(), page: 1 })}`, {
          scroll: false,
        })
      }
    }, 300)
    return () => clearTimeout(timer)
  }, [search, filters.search, searchKey, path, router])
  useEffect(() => {
    if (
      data.data &&
      data.data.total > 0 &&
      filters.page > Math.ceil(data.data.total / filters.pageSize)
    ) {
      const next = websiteFilters(new URLSearchParams(searchKey))
      router.replace(
        `${path}?${websiteSearch({ ...next, page: Math.ceil(data.data.total / next.pageSize) })}`,
        { scroll: false },
      )
    }
  }, [data.data, filters.page, filters.pageSize, searchKey, path, router])
  const filtered = !!filters.search || filters.tagIds.length > 0
  const clear = () => {
    setSearch('')
    update({ search: '', tagIds: [], page: 1 })
  }
  return (
    <Stack spacing={3}>
      <Box>
        <Typography variant="h4" component="h1">
          {c.websites}
        </Typography>
        <Typography color="text.secondary" sx={{ mt: 1 }}>
          {c.websiteIntro}
        </Typography>
      </Box>
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
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', sm: 'repeat(2,1fr)', xl: 'repeat(3,1fr)' },
            gap: 2,
          }}
        >
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <Skeleton key={n} variant="rounded" height={205} />
          ))}
        </Box>
      ) : data.data?.websites.length === 0 ? (
        <Empty
          title={filtered ? c.noResults : c.noWebsites}
          body={filtered ? c.noResultsBody : c.noWebsitesBody}
          action={
            <Button onClick={filtered ? clear : () => setForm('new')}>
              {filtered ? c.clear : c.addWebsite}
            </Button>
          }
        />
      ) : (
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: {
              xs: '1fr',
              sm: 'repeat(2,minmax(0,1fr))',
              xl: 'repeat(3,minmax(0,1fr))',
            },
            gap: 2,
          }}
        >
          {data.data?.websites.map((website) => (
            <WebsiteCard key={website.id} website={website} onEdit={setForm} />
          ))}
        </Box>
      )}
      {data.data && data.data.total > 0 && (
        <WebsitePagination total={data.data.total} filters={filters} update={update} />
      )}
      {form && (
        <WebsiteForm website={form === 'new' ? undefined : form} onClose={() => setForm(null)} />
      )}
    </Stack>
  )
}
