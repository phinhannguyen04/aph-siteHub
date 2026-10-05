import { attempt, failure, success, type Result } from '../../shared/result'

export interface Tag {
  id: string
  name: string
  description: string
  color: string
  created_at: string
  updated_at: string
}
export interface Website {
  id: string
  name: string
  url: string
  tag_ids: string[]
  tags: Tag[]
  created_at: string
  updated_at: string
}
export interface ListOptions {
  page: number
  pageSize: number
  search: string
  tagIds: string[]
}
export interface WebsitePage {
  websites: Website[]
  total: number
  page: number
  pageSize: number
}
export interface ApiFailure {
  code: string
  message: string
  status: number
}
export type ApiResult<T> = Result<T, ApiFailure>
let csrfToken = ''
export function setCsrfToken(token: string) {
  csrfToken = token
}
async function request<T>(path: string, options: RequestInit = {}): Promise<ApiResult<T>> {
  const fetched = await attempt(() =>
    fetch(path, {
      ...options,
      credentials: 'same-origin',
      headers: {
        ...(options.body ? { 'content-type': 'application/json' } : {}),
        ...(options.method && options.method !== 'GET' && csrfToken
          ? { 'x-csrf-token': csrfToken }
          : {}),
        ...options.headers,
      },
    }),
  )
  if (fetched.code !== 0)
    return failure({ code: 'NETWORK_ERROR', message: 'Unable to connect to the server', status: 0 })
  const response = fetched.data
  const parsed = await attempt(() => response.json())
  const data = parsed.code === 0 ? parsed.data : null
  if (!response.ok)
    return failure({
      code: data?.error?.code || 'HTTP_ERROR',
      message: data?.error?.message || `HTTP error ${response.status}`,
      status: response.status,
    })
  if (parsed.code !== 0 || data === null)
    return failure({
      code: 'INVALID_RESPONSE',
      message: 'Invalid server response',
      status: response.status,
    })
  return success(data as T)
}
export const api = {
  session: () => request<{ csrfToken: string }>('/api/auth/session'),
  login: (password: string) =>
    request<{ csrfToken: string }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ password }),
    }),
  logout: () => request<{ ok: boolean }>('/api/auth/logout', { method: 'POST' }),
  changePassword: (input: { currentPassword: string; newPassword: string }) =>
    request<{ csrfToken: string }>('/api/auth/change-password', {
      method: 'POST',
      body: JSON.stringify(input),
    }),
  list: (options: ListOptions) => {
    const params = new URLSearchParams({
      page: String(options.page),
      pageSize: String(options.pageSize),
    })
    if (options.search) params.set('search', options.search)
    if (options.tagIds.length) params.set('tagIds', options.tagIds.join(','))
    return request<WebsitePage>(`/api/websites?${params}`)
  },
  count: () => request<{ count: number }>('/api/websites/count'),
  create: (input: { name: string; url: string; tag_ids: string[] }) =>
    request<{ website: Website }>('/api/websites', { method: 'POST', body: JSON.stringify(input) }),
  update: (id: string, input: { name: string; url: string; tag_ids: string[] }) =>
    request<{ website: Website }>(`/api/websites/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      body: JSON.stringify(input),
    }),
  tags: () => request<{ tags: Tag[] }>('/api/tags'),
  createTag: (input: { name: string; description: string; color: string }) =>
    request<{ tag: Tag }>('/api/tags', { method: 'POST', body: JSON.stringify(input) }),
  updateTag: (id: string, input: { name: string; description: string; color: string }) =>
    request<{ tag: Tag }>(`/api/tags/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      body: JSON.stringify(input),
    }),
  deleteTag: (id: string) =>
    request<{ ok: boolean }>(`/api/tags/${encodeURIComponent(id)}`, { method: 'DELETE' }),
}
