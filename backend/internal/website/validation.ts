import { z } from 'zod'

export const websiteNameSchema = z
  .string({ error: 'Website name is required' })
  .trim()
  .min(1, 'Website name is required')
  .max(160, 'Website name must be at most 160 characters')

export const websiteUrlSchema = z
  .string({ error: 'URL is required' })
  .trim()
  .min(1, 'URL is required')
  .transform((value, ctx) => {
    const url = URL.parse(value)
    if (!url) {
      ctx.issues.push({ code: 'custom', message: 'Invalid URL', input: value })
      return z.NEVER
    }
    if (
      !['http:', 'https:'].includes(url.protocol) ||
      !url.hostname ||
      url.username ||
      url.password
    ) {
      ctx.issues.push({
        code: 'custom',
        message: 'URL must use HTTP or HTTPS and must not contain credentials',
        input: value,
      })
      return z.NEVER
    }
    if (url.href.length > 2048) {
      ctx.issues.push({
        code: 'custom',
        message: 'URL must be at most 2048 characters',
        input: value,
      })
      return z.NEVER
    }
    return url.href
  })
