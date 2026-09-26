export interface Website {
  id: string
  name: string
  url: string
  created_at: string
  updated_at: string
}
export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message)
  }
}

let csrfToken = ''
export function setCsrfToken(token: string) {
  csrfToken = token
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  let response: Response
  try {
    response = await fetch(path, {
      ...options,
      credentials: 'same-origin',
      headers: {
        ...(options.body ? { 'content-type': 'application/json' } : {}),
        ...(options.method && options.method !== 'GET' && csrfToken
          ? { 'x-csrf-token': csrfToken }
          : {}),
        ...options.headers,
      },
    })
  } catch {
    throw new ApiError('Unable to connect to the server', 0)
  }
  const data = await response.json().catch(() => null)
  if (!response.ok)
    throw new ApiError(data?.error?.message || `HTTP error ${response.status}`, response.status)
  return data as T
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
  list: () => request<{ websites: Website[] }>('/api/websites'),
  count: () => request<{ count: number }>('/api/websites/count'),
  create: (input: { name: string; url: string }) =>
    request<{ website: Website }>('/api/websites', { method: 'POST', body: JSON.stringify(input) }),
  update: (id: string, input: { name: string; url: string }) =>
    request<{ website: Website }>(`/api/websites/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      body: JSON.stringify(input),
    }),
}
