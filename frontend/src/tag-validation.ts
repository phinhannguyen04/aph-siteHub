export function normalizeTagName(value: string) {
  return value.trim().replace(/^#+/, '').trim()
}
export function validateTag(input: { name: string; description: string; color: string }) {
  const name = normalizeTagName(input.name)
  if (!name) return 'Tag name is required'
  if (name.length > 64) return 'Tag name must be at most 64 characters'
  if (input.description.trim().length > 240) return 'Description must be at most 240 characters'
  if (!/^#[0-9a-fA-F]{6}$/.test(input.color)) return 'Color must be a six-digit hex value'
  return ''
}
