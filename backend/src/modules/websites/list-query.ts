import { serviceFailure, success, type ServiceResult } from '../../common/errors/result'

export interface ListQuery {
  page: number
  pageSize: number
  search: string
  tagIds: string[]
}

/**
 * Validate supported query parameters and normalize pagination, search text, and unique
 * tag IDs.
 */
export function parseListQuery(raw: Record<string, unknown>): ServiceResult<ListQuery> {
  const allowed = new Set(['page', 'pageSize', 'search', 'tagIds'])

  if (Object.keys(raw).some((key) => !allowed.has(key))) {
    return serviceFailure('VALIDATION_ERROR', 'Unknown query parameter', 400)
  }

  /**
   * Parse a positive integer query value within its upper bound, using the fallback
   * when it is absent.
   */
  function integer(
    value: unknown,
    fallback: number,
    max: number,
    label: string,
  ): ServiceResult<number> {
    if (value === undefined) {
      return success(fallback)
    }

    if (typeof value !== 'string' || !/^[1-9]\d*$/.test(value)) {
      return serviceFailure('VALIDATION_ERROR', 'Invalid ' + label, 400)
    }

    const parsed = Number(value)

    if (!Number.isSafeInteger(parsed) || parsed > max) {
      return serviceFailure('VALIDATION_ERROR', 'Invalid ' + label, 400)
    }

    return success(parsed)
  }
  const page = integer(raw.page, 1, 1000000, 'page')

  if (page.code !== 0) {
    return page
  }

  const pageSize = integer(raw.pageSize, 12, 48, 'pageSize')

  if (pageSize.code !== 0) {
    return pageSize
  }

  if (raw.search !== undefined && (typeof raw.search !== 'string' || raw.search.length > 160)) {
    return serviceFailure('VALIDATION_ERROR', 'Invalid search', 400)
  }

  const search = typeof raw.search === 'string' ? raw.search.trim() : ''

  if (raw.tagIds !== undefined && typeof raw.tagIds !== 'string') {
    return serviceFailure('VALIDATION_ERROR', 'Invalid tagIds', 400)
  }

  const tagIds = raw.tagIds ? (raw.tagIds as string).split(',') : []

  if (
    tagIds.length > 50 ||
    tagIds.some((id) => !/^[0-9a-f-]{36}$/i.test(id)) ||
    new Set(tagIds).size !== tagIds.length
  ) {
    return serviceFailure('VALIDATION_ERROR', 'Invalid tagIds', 400)
  }

  return success({ page: page.data, pageSize: pageSize.data, search, tagIds })
}
