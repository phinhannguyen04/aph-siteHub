import { buttonVariants } from '@/components/ui/button'

/** Shared Tailwind class strings for the SiteHub look. */
export const card = 'rounded-md border border-border bg-background'
export const help = 'text-xs text-subtle'
export const row = 'flex items-center gap-2'
export const rowActions = 'flex justify-end gap-0.5'
export const toolbar = 'flex flex-wrap items-center gap-2'
export const cellLink =
  'cursor-pointer border-0 bg-transparent p-0 text-left font-semibold text-primary hover:underline'

/** Class list for an anchor that should look like a primary button. */
export const buttonLink = buttonVariants({ variant: 'default' })

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
