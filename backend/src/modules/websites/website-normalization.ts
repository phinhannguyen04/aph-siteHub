import { serviceFailure, success, type ServiceResult } from '../../common/errors/result'

export function normalizeName(value: unknown): ServiceResult<string> {
  if (typeof value !== 'string' || !value.trim())
    return serviceFailure('VALIDATION_ERROR', 'Website name is required', 400)
  const name = value.trim()
  if (name.length > 160)
    return serviceFailure('VALIDATION_ERROR', 'Website name must be at most 160 characters', 400)
  return success(name)
}

export function normalizeUrl(value: unknown): ServiceResult<string> {
  if (typeof value !== 'string' || !value.trim())
    return serviceFailure('VALIDATION_ERROR', 'URL is required', 400)
  const url = URL.parse(value.trim())
  if (!url) return serviceFailure('VALIDATION_ERROR', 'Invalid URL', 400)
  if (!['http:', 'https:'].includes(url.protocol) || !url.hostname || url.username || url.password)
    return serviceFailure(
      'VALIDATION_ERROR',
      'URL must use HTTP or HTTPS and must not contain credentials',
      400,
    )
  if (url.href.length > 2048)
    return serviceFailure('VALIDATION_ERROR', 'URL must be at most 2048 characters', 400)
  return success(url.href)
}
