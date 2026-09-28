import { ValidationError } from '../common/errors/validation-error'
export interface ListQuery {
  page: number
  pageSize: number
  search: string
  tagIds: string[]
}
export function parseListQuery(raw: Record<string, unknown>): ListQuery {
  const allowed = new Set(['page', 'pageSize', 'search', 'tagIds'])
  if (Object.keys(raw).some((key) => !allowed.has(key)))
    throw new ValidationError('Unknown query parameter')
  function integer(value: unknown, fallback: number, max: number, label: string) {
    if (value === undefined) return fallback
    if (typeof value !== 'string' || !/^[1-9]\d*$/.test(value))
      throw new ValidationError('Invalid ' + label)
    const parsed = Number(value)
    if (!Number.isSafeInteger(parsed) || parsed > max) throw new ValidationError('Invalid ' + label)
    return parsed
  }
  const page = integer(raw.page, 1, 1000000, 'page')
  const pageSize = integer(raw.pageSize, 12, 48, 'pageSize')
  if (
    typeof raw.search !== 'undefined' &&
    (typeof raw.search !== 'string' || raw.search.length > 160)
  )
    throw new ValidationError('Invalid search')
  const search = typeof raw.search === 'string' ? raw.search.trim() : ''
  if (raw.tagIds !== undefined && typeof raw.tagIds !== 'string')
    throw new ValidationError('Invalid tagIds')
  const tagIds = raw.tagIds ? (raw.tagIds as string).split(',') : []
  if (
    tagIds.length > 50 ||
    tagIds.some((id) => !/^[0-9a-f-]{36}$/i.test(id)) ||
    new Set(tagIds).size !== tagIds.length
  )
    throw new ValidationError('Invalid tagIds')
  return { page, pageSize, search, tagIds }
}
