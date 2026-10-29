import { c } from '../copy'
import type { ApiError, Result } from './types'

let csrfToken = ''
let generation = 0
let unauthorized = () => {}
export function setToken(token: string) {
  csrfToken = token
  generation++
}
export function onUnauthorized(callback: () => void) {
  unauthorized = callback
  return () => {
    unauthorized = () => {}
  }
}
export async function request<T>(path: string, method = 'GET', body?: object): Promise<Result<T>> {
  const started = generation
  try {
    const response = await fetch(path, {
      method,
      credentials: 'same-origin',
      cache: 'no-store',
      headers: {
        ...(body ? { 'Content-Type': 'application/json' } : {}),
        ...(method !== 'GET' ? { 'x-csrf-token': csrfToken } : {}),
      },
      ...(body ? { body: JSON.stringify(body) } : {}),
    })
    const data = await response.json().catch(() => null)
    if (!response.ok) {
      const error: ApiError = {
        code: data?.error?.code ?? 'REQUEST_ERROR',
        message: data?.error?.message ?? response.statusText,
        status: response.status,
      }
      if (
        response.status === 401 &&
        started === generation &&
        path !== '/api/auth/login' &&
        path !== '/api/auth/change-password' &&
        (path !== '/api/auth/session' || csrfToken !== '')
      ) {
        setToken('')
        unauthorized()
      }
      if (response.status === 401 && path === '/api/auth/change-password' && started === generation)
        await request('/api/auth/session')
      return { ok: false, error }
    }
    if (started !== generation)
      return {
        ok: false,
        error: { code: 'STALE_REQUEST', message: c.stale, status: 0 },
      }
    if (data === null)
      return {
        ok: false,
        error: { code: 'INVALID_RESPONSE', message: c.invalidResponse, status: response.status },
      }
    return { ok: true, data }
  } catch {
    return {
      ok: false,
      error: {
        code: 'NETWORK_ERROR',
        message: c.network,
        status: 0,
      },
    }
  }
}
export async function query<T>(path: string): Promise<T> {
  const result = await request<T>(path)
  if (!result.ok) throw result.error
  return result.data
}
