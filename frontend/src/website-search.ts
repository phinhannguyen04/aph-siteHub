import type { ListOptions } from './api'

export const defaultWebsiteSearch: ListOptions = { search: '', tagIds: [], page: 1, pageSize: 12 }

export function parseWebsiteSearch(input: Record<string, unknown>): ListOptions {
  const page = Number(input.page)
  const pageSize = Number(input.pageSize)
  const ids = Array.isArray(input.tagIds)
    ? input.tagIds
    : typeof input.tagIds === 'string'
      ? input.tagIds.split(',')
      : []
  return {
    search: typeof input.search === 'string' ? input.search.slice(0, 160) : '',
    tagIds: [
      ...new Set(
        ids.filter((id): id is string => typeof id === 'string' && /^[0-9a-f-]{36}$/i.test(id)),
      ),
    ].slice(0, 50),
    page: Number.isSafeInteger(page) && page > 0 ? page : 1,
    pageSize: [12, 24, 48].includes(pageSize) ? pageSize : 12,
  }
}
