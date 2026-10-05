import { z } from 'zod'
import { websiteNameSchema, websiteUrlSchema } from './validation'

const tagIdsSchema = z
  .array(z.uuidv4())
  .max(50)
  .refine((ids) => new Set(ids).size === ids.length, 'Invalid tag IDs')

export const createWebsiteSchema = z.strictObject({
  name: websiteNameSchema,
  url: websiteUrlSchema,
  tag_ids: tagIdsSchema.optional(),
})

export const updateWebsiteSchema = createWebsiteSchema
  .partial()
  .refine(
    (input) => input.name !== undefined || input.url !== undefined || input.tag_ids !== undefined,
    'Provide a website name, URL or tags',
  )
