import { attempt, failure, type Result } from '../../../shared/result'

export { attempt, attemptSync, failure, success } from '../../../shared/result'
export interface ServiceFailure {
  code: string
  message: string
  status: number
  cause?: unknown
}
export type ServiceResult<T> = Result<T, ServiceFailure>

export function serviceFailure(
  code: string,
  message: string,
  status: number,
): ServiceResult<never> {
  return failure({ code, message, status })
}

export function unexpectedFailure(cause: unknown): ServiceResult<never> {
  return failure({ code: 'INTERNAL_ERROR', message: 'Internal server error', status: 500, cause })
}

/** Convert exception-based database/ORM calls into service return codes. */
export async function operation<T>(
  callback: () => ServiceResult<T> | PromiseLike<ServiceResult<T>>,
): Promise<ServiceResult<T>> {
  const result = await attempt(callback)
  if (result.code !== 0) return unexpectedFailure(result.error)
  return result.data
}
