import { useCallback, useEffect, useState } from 'react'
import { useSearchParams } from 'react-router'
import { websiteFilters, websiteSearch } from '@/lib/api'

/**
 * Website list filters kept in the URL. Writes replace (not push) so typing and paging do not
 * fill the history; the search box is debounced and a page past the end falls back to the last.
 */
export function useWebsiteFilters() {
  const [params, setParams] = useSearchParams()
  const filters = websiteFilters(params)
  const searchKey = websiteSearch(filters)
  const [search, setSearch] = useState(filters.search)

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

  return {
    filters,
    searchKey,
    search,
    setSearch,
    update,
    replaceFilters,
    filtered,
    clear,
    toggleTag,
  }
}

/** A deleted last page (or a shrunken result set) falls back to the new last page. */
export function useClampPage(total, { filters, searchKey, replaceFilters }) {
  useEffect(() => {
    if (total > 0 && filters.page > Math.ceil(total / filters.pageSize)) {
      const next = websiteFilters(new URLSearchParams(searchKey))
      replaceFilters({ ...next, page: Math.ceil(total / next.pageSize) })
    }
  }, [total, filters.page, filters.pageSize, searchKey, replaceFilters])
}
