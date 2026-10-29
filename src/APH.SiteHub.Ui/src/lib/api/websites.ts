import type { Website } from './types'
export type WebsiteInput = { name: string; url: string; tag_ids: string[] }
export function websitePatch(original: Website, input: WebsiteInput): Partial<WebsiteInput> {
  return {
    ...(input.name !== original.name ? { name: input.name } : {}),
    ...(input.url !== original.url ? { url: input.url } : {}),
    ...(JSON.stringify(input.tag_ids) !== JSON.stringify(original.tag_ids)
      ? { tag_ids: input.tag_ids }
      : {}),
  }
}
export function websiteFilters(params: URLSearchParams) {
  const int = (key: string, fallback: number, max: number) => {
    const v = params.get(key) ?? ''
    return /^[1-9]\d*$/.test(v) && Number(v) <= max ? Number(v) : fallback
  }
  const size = int('pageSize', 12, 48)
  const ids = [
    ...new Set(
      (params.get('tagIds') ?? '')
        .split(',')
        .filter((v) => /^[\da-f]{8}-[\da-f]{4}-4[\da-f]{3}-[89ab][\da-f]{3}-[\da-f]{12}$/i.test(v)),
    ),
  ].slice(0, 50)
  return {
    page: int('page', 1, 1000000),
    pageSize: [12, 24, 48].includes(size) ? size : 12,
    search: (params.get('search') ?? '').trim().slice(0, 160),
    tagIds: ids,
  }
}
export function websiteSearch(filters: ReturnType<typeof websiteFilters>) {
  const p = new URLSearchParams({ page: String(filters.page), pageSize: String(filters.pageSize) })
  if (filters.search) p.set('search', filters.search)
  if (filters.tagIds.length) p.set('tagIds', filters.tagIds.join(','))
  return p.toString()
}
