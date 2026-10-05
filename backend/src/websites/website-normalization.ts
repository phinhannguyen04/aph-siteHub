import { ValidationError } from '../common/errors/validation-error'

export function normalizeName(value: unknown): string {
  if (typeof value !== 'string' || !value.trim())
    throw new ValidationError('Website name is required')
  const name = value.trim()
  if (name.length > 160) throw new ValidationError('Website name must be at most 160 characters')
  return name
}

export function normalizeUrl(value: unknown): string {
  if (typeof value !== 'string' || !value.trim()) throw new ValidationError('URL is required')
  const url = URL.parse(value.trim())
  if (!url) throw new ValidationError('Invalid URL')
  if (!['http:', 'https:'].includes(url.protocol) || !url.hostname || url.username || url.password)
    throw new ValidationError('URL must use HTTP or HTTPS and must not contain credentials')
  if (url.href.length > 2048) throw new ValidationError('URL must be at most 2048 characters')
  return url.href
}
