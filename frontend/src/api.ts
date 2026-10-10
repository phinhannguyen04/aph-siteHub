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
export interface Account {
  id: string
  provider: string
  login_name: string
  external_account_id: string
  email: string
  is_limit: boolean
  created_at: string
}
export interface CreateAccountInput {
  provider: string
  login_name: string
  external_account_id: string
  email: string
  password: string
  secret_key: string
  is_limit: boolean
}
export type UpdateAccountInput = Partial<
  Pick<CreateAccountInput, 'password' | 'secret_key' | 'is_limit'>
>
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
// Same-origin /api is served by ASP.NET Core Minimal API through Nginx/Vite.
const apiPrefix = '/api'
let csrfToken = ''
export function setCsrfToken(token: string) {
  csrfToken = token
}
async function request<T>(path: string, options: RequestInit = {}): Promise<ApiResult<T>> {
  const fetched = await attempt(() =>
    fetch(`${apiPrefix}${path}`, {
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
  session: () => request<{ csrfToken: string }>('/auth/session'),
  login: (password: string) =>
    request<{ csrfToken: string }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ password }),
    }),
  logout: () => request<{ ok: boolean }>('/auth/logout', { method: 'POST' }),
  changePassword: (input: { currentPassword: string; newPassword: string }) =>
    request<{ csrfToken: string }>('/auth/change-password', {
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
    return request<WebsitePage>(`/websites?${params}`)
  },
  count: () => request<{ count: number }>('/websites/count'),
  create: (input: { name: string; url: string; tag_ids: string[] }) =>
    request<{ website: Website }>('/websites', { method: 'POST', body: JSON.stringify(input) }),
  update: (id: string, input: { name: string; url: string; tag_ids: string[] }) =>
    request<{ website: Website }>(`/websites/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      body: JSON.stringify(input),
    }),
  accounts: () => request<{ accounts: Account[] }>('/accounts'),
  account: (id: string) => request<{ account: Account }>(`/accounts/${encodeURIComponent(id)}`),
  createAccount: (input: CreateAccountInput) =>
    request<{ account: Account }>('/accounts', { method: 'POST', body: JSON.stringify(input) }),
  updateAccount: (id: string, input: UpdateAccountInput) =>
    request<{ account: Account }>(`/accounts/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      body: JSON.stringify(input),
    }),
  deleteAccount: (id: string) =>
    request<{ ok: boolean }>(`/accounts/${encodeURIComponent(id)}`, { method: 'DELETE' }),
  accountSecret: (id: string) =>
    request<{ secret_key: string }>(`/accounts/${encodeURIComponent(id)}/secret-key`),
  tags: () => request<{ tags: Tag[] }>('/tags'),
  createTag: (input: { name: string; description: string; color: string }) =>
    request<{ tag: Tag }>('/tags', { method: 'POST', body: JSON.stringify(input) }),
  updateTag: (id: string, input: { name: string; description: string; color: string }) =>
    request<{ tag: Tag }>(`/tags/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      body: JSON.stringify(input),
    }),
  deleteTag: (id: string) =>
    request<{ ok: boolean }>(`/tags/${encodeURIComponent(id)}`, { method: 'DELETE' }),
}
