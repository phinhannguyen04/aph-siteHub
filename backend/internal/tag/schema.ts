import { z } from 'zod'

export const tagSchema = z.strictObject({
  name: z
    .string({ error: 'Tag name is required' })
    .transform((value) => value.trim().replace(/^#+/, '').trim())
    .pipe(
      z.string().min(1, 'Tag name is required').max(64, 'Tag name must be at most 64 characters'),
    ),
  description: z.preprocess(
    (value) => (value === null ? '' : value),
    z
      .string({ error: 'Description must be at most 240 characters' })
      .trim()
      .max(240, 'Description must be at most 240 characters')
      .default(''),
  ),
  color: z
    .string({ error: 'Color must be a six-digit hex value' })
    .regex(/^#[0-9a-fA-F]{6}$/, 'Color must be a six-digit hex value')
    .transform((value) => value.toLowerCase()),
})
