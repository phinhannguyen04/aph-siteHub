import { c } from '../copy'
import type { ApiError, Result } from './types'

export async function request<T>(path: string, method = 'GET', body?: object): Promise<Result<T>> {
  try {
    const response = await fetch(path, {
      method,
      cache: 'no-store',
      headers: body ? { 'Content-Type': 'application/json' } : {},
      ...(body ? { body: JSON.stringify(body) } : {}),
    })
    const data = await response.json().catch(() => null)
    if (!response.ok) {
      const error: ApiError = {
        code: data?.error?.code ?? 'REQUEST_ERROR',
        message: data?.error?.message ?? response.statusText,
        status: response.status,
      }
      return { ok: false, error }
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
