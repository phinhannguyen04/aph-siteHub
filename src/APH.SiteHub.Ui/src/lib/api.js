import { c } from './copy.js'

/** Performs a same-origin API call and never throws: returns `{ ok, data }` or `{ ok: false, error }`. */
export async function request(path, method = 'GET', body) {
  try {
    const response = await fetch(path, {
      method,
      cache: 'no-store',
      headers: body ? { 'Content-Type': 'application/json' } : {},
      ...(body ? { body: JSON.stringify(body) } : {}),
    })
    const data = await response.json().catch(() => null)
    if (!response.ok) {
      return {
        ok: false,
        error: {
          code: data?.error?.code ?? 'REQUEST_ERROR',
          message: data?.error?.message ?? response.statusText,
          status: response.status,
        },
      }
    }
    if (data === null) {
      return {
        ok: false,
        error: { code: 'INVALID_RESPONSE', message: c.invalidResponse, status: response.status },
      }
    }
    return { ok: true, data }
  } catch {
    return { ok: false, error: { code: 'NETWORK_ERROR', message: c.network, status: 0 } }
  }
}

/** React Query adapter: resolves with the data or throws the API error. */
export async function query(path) {
  const result = await request(path)
  if (!result.ok) throw result.error
  return result.data
}

export function deleteWebsite(id) {
  return request(`/api/websites/${encodeURIComponent(id)}`, 'DELETE')
}

export function deleteAccount(id) {
  return request(`/api/accounts/${encodeURIComponent(id)}`, 'DELETE')
}

export function deleteTag(id) {
  return request(`/api/tags/${encodeURIComponent(id)}`, 'DELETE')
}

/** Only the changed fields are sent, so a PATCH never overwrites concurrent edits. */
export function websitePatch(original, input) {
  return {
    ...(input.name !== original.name ? { name: input.name } : {}),
    ...(input.url !== original.url ? { url: input.url } : {}),
    ...(JSON.stringify(input.tag_ids) !== JSON.stringify(original.tag_ids)
      ? { tag_ids: input.tag_ids }
      : {}),
  }
}

export function accountPatch(original, input) {
  return {
    ...(input.password ? { password: input.password } : {}),
    ...(input.secret_key ? { secret_key: input.secret_key } : {}),
    ...(input.is_limit !== original.is_limit ? { is_limit: input.is_limit } : {}),
  }
}

const uuid = /^[\da-f]{8}-[\da-f]{4}-4[\da-f]{3}-[89ab][\da-f]{3}-[\da-f]{12}$/i

/** Sanitises the website list URL parameters; anything invalid falls back to the defaults. */
export function websiteFilters(params) {
  const int = (key, fallback, max) => {
    const v = params.get(key) ?? ''
    return /^[1-9]\d*$/.test(v) && Number(v) <= max ? Number(v) : fallback
  }
  const size = int('pageSize', 12, 48)
  const ids = [
    ...new Set((params.get('tagIds') ?? '').split(',').filter((v) => uuid.test(v))),
  ].slice(0, 50)
  return {
    page: int('page', 1, 1000000),
    pageSize: [12, 24, 48].includes(size) ? size : 12,
    search: (params.get('search') ?? '').trim().slice(0, 160),
    tagIds: ids,
  }
}

export function websiteSearch(filters) {
  const p = new URLSearchParams({ page: String(filters.page), pageSize: String(filters.pageSize) })
  if (filters.search) p.set('search', filters.search)
  if (filters.tagIds.length) p.set('tagIds', filters.tagIds.join(','))
  return p.toString()
}
