import { c } from '../copy'

export type FieldErrors<Field extends string> = Partial<Record<Field, string>>
export type WebsiteErrors = FieldErrors<'name' | 'url' | 'tag_ids'>
export type TagErrors = FieldErrors<'name' | 'description' | 'color'>
export type AccountField =
  | 'provider'
  | 'login_name'
  | 'external_account_id'
  | 'email'
  | 'password'
  | 'secret_key'
export type AccountErrors = FieldErrors<AccountField>
export type PasswordErrors = FieldErrors<'currentPassword' | 'newPassword' | 'confirmPassword'>
export function password(value: string, min = 1) {
  return value.trim().length > 0 && value.length >= min && value.length <= 256
}
export function login(value: string): FieldErrors<'password'> {
  return password(value) ? {} : { password: c.invalidPassword }
}
export function changePassword(current: string, next: string, confirm: string): PasswordErrors {
  const errors: PasswordErrors = {}
  if (!password(current)) errors.currentPassword = c.invalidPassword
  if (!password(next, 12)) errors.newPassword = c.invalidNewPassword
  else if (current === next) errors.newPassword = c.passwordDifferent
  if (next !== confirm) errors.confirmPassword = c.passwordMismatch
  return errors
}
export function website(name: string, url: string, ids: string[]): WebsiteErrors {
  const errors: WebsiteErrors = {}
  if (!name.trim()) errors.name = c.nameRequired
  else if (name.trim().length > 160) errors.name = c.websiteNameLength
  if (!url.trim()) errors.url = c.urlRequired
  else if (url.trim().length > 2048) errors.url = c.urlLength
  else {
    try {
      const u = new URL(url.trim())
      if (!['http:', 'https:'].includes(u.protocol) || !u.hostname) errors.url = c.urlProtocol
      else if (u.username || u.password) errors.url = c.urlCredentials
      else if (u.href.length > 2048) errors.url = c.urlLength
    } catch {
      errors.url = c.urlProtocol
    }
  }
  if (ids.length > 50 || new Set(ids).size !== ids.length) errors.tag_ids = c.invalidTags
  return errors
}
export function tagName(name: string) {
  return name.trim().replace(/^#+/, '').trim()
}
export function tag(name: string, description: string, color: string): TagErrors {
  const errors: TagErrors = {}
  if (!tagName(name)) errors.name = c.tagNameRequired
  else if (name.trim().length > 256 || tagName(name).length > 64) errors.name = c.tagNameLength
  if (description.trim().length > 240) errors.description = c.descriptionLength
  if (!/^#[\da-f]{6}$/i.test(color)) errors.color = c.colorFormat
  return errors
}
export function account(values: Record<AccountField, string>, editing = false): AccountErrors {
  const errors: AccountErrors = {}
  const labels = {
    provider: c.provider,
    login_name: c.loginName,
    external_account_id: c.externalId,
    email: c.email,
    password: c.password,
    secret_key: c.secret,
  }
  for (const key of Object.keys(labels) as AccountField[]) {
    const secret = key === 'password' || key === 'secret_key'
    if (editing && (!secret || values[key] === '')) continue
    if (!values[key].trim()) errors[key] = c.fieldRequired(labels[key])
    else if (!secret && values[key].trim().length > 4096) errors[key] = c.fieldLength(labels[key])
  }
  if (!editing && !errors.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email.trim()))
    errors.email = c.emailFormat
  return errors
}
