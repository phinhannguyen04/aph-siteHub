import { c } from './copy.js'

export function website(name, url, ids) {
  const errors = {}
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

export function tagName(name) {
  return name.trim().replace(/^#+/, '').trim()
}

export function tag(name, description, color) {
  const errors = {}
  if (!tagName(name)) errors.name = c.tagNameRequired
  else if (name.trim().length > 256 || tagName(name).length > 64) errors.name = c.tagNameLength
  if (description.trim().length > 240) errors.description = c.descriptionLength
  if (!/^#[\da-f]{6}$/i.test(color)) errors.color = c.colorFormat
  return errors
}

export function account(values, editing = false) {
  const errors = {}
  const labels = {
    provider: c.provider,
    login_name: c.loginName,
    external_account_id: c.externalId,
    email: c.email,
    password: c.password,
    secret_key: c.secret,
  }
  for (const key of Object.keys(labels)) {
    const secret = key === 'password' || key === 'secret_key'
    if (editing && (!secret || values[key] === '')) continue
    if (!values[key].trim()) errors[key] = c.fieldRequired(labels[key])
    else if (!secret && values[key].trim().length > 4096) errors[key] = c.fieldLength(labels[key])
  }
  if (!editing && !errors.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email.trim()))
    errors.email = c.emailFormat
  return errors
}
