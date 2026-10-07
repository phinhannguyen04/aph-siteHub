import { serviceFailure, success, type ServiceResult } from '../../common/errors/result'

/**
 * Trim a tag name, remove leading hash characters, and enforce its required value and
 * length limit.
 */
export function normalizeTagName(value: unknown): ServiceResult<string> {
  if (typeof value !== 'string') {
    return serviceFailure('VALIDATION_ERROR', 'Tag name is required', 400)
  }

  const name = value.trim().replace(/^#+/, '').trim()

  if (!name) {
    return serviceFailure('VALIDATION_ERROR', 'Tag name is required', 400)
  }

  if (name.length > 64) {
    return serviceFailure('VALIDATION_ERROR', 'Tag name must be at most 64 characters', 400)
  }

  return success(name)
}

/** Normalize an optional tag description to a trimmed string and enforce its length limit. */
export function normalizeTagDescription(value: unknown): ServiceResult<string> {
  if (value === undefined || value === null) {
    return success('')
  }

  if (typeof value !== 'string' || value.trim().length > 240) {
    return serviceFailure('VALIDATION_ERROR', 'Description must be at most 240 characters', 400)
  }

  return success(value.trim())
}

/** Validate a six-digit hexadecimal color and normalize it to lowercase. */
export function normalizeTagColor(value: unknown): ServiceResult<string> {
  if (typeof value !== 'string' || !/^#[0-9a-fA-F]{6}$/.test(value)) {
    return serviceFailure('VALIDATION_ERROR', 'Color must be a six-digit hex value', 400)
  }

  return success(value.toLowerCase())
}
