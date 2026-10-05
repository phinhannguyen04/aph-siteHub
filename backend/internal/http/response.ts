import type { Context } from 'hono'
import type { ContentfulStatusCode } from 'hono/utils/http-status'
import { apiError } from './error'
import type { ServiceFailure, ServiceResult } from '../result/result'
import type { AppEnv } from './types'

export function errorResponse(c: Context<AppEnv>, error: ServiceFailure) {
  if (error.cause !== undefined) console.error(error.cause)
  return c.json(apiError(error.code, error.message), error.status as ContentfulStatusCode)
}

export function resultResponse<T>(
  c: Context<AppEnv>,
  result: ServiceResult<T>,
  body: (data: T) => unknown = (data) => data,
  status: ContentfulStatusCode = 200,
) {
  if (result.code !== 0) return errorResponse(c, result.error)
  return c.json(body(result.data), status)
}
