export const cx = (...values) => values.filter(Boolean).join(' ')

/** Class list for an anchor that should look like a primary button. */
export const buttonLink = 'btn btn-primary'

export function localDate(value) {
  const date = new Date(value)
  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })
}

/** Readable text colour (dark or white) for a `#rrggbb` background. */
export function tagTextColor(color) {
  const n = Number.parseInt(color.slice(1), 16)
  const luminance = (0.299 * (n >> 16) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255)) / 255
  return luminance > 0.6 ? '#1a1a1a' : '#ffffff'
}
