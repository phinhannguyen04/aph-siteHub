import { ValidationError } from '../common/errors/validation-error'
export function normalizeTagName(value: unknown): string {
  if (typeof value !== 'string') throw new ValidationError('Tag name is required')
  const name = value.trim().replace(/^#+/, '').trim()
  if (!name) throw new ValidationError('Tag name is required')
  if (name.length > 64) throw new ValidationError('Tag name must be at most 64 characters')
  return name
}
export function normalizeTagDescription(value: unknown): string {
  if (value === undefined || value === null) return ''
  if (typeof value !== 'string' || value.trim().length > 240)
    throw new ValidationError('Description must be at most 240 characters')
  return value.trim()
}
export function normalizeTagColor(value: unknown): string {
  if (typeof value !== 'string' || !/^#[0-9a-fA-F]{6}$/.test(value))
    throw new ValidationError('Color must be a six-digit hex value')
  return value.toLowerCase()
}
