import { z } from 'zod'

function integer(fallback: number, max: number, label: string) {
  return z
    .string()
    .regex(/^[1-9]\d*$/, 'Invalid ' + label)
    .transform(Number)
    .refine((value) => Number.isSafeInteger(value) && value <= max, 'Invalid ' + label)
    .default(fallback)
}

export const listQuerySchema = z.strictObject({
  page: integer(1, 1000000, 'page'),
  pageSize: integer(12, 48, 'pageSize'),
  search: z
    .string()
    .max(160, 'Invalid search')
    .transform((value) => value.trim())
    .default(''),
  tagIds: z
    .string()
    .transform((value) => (value ? value.split(',') : []))
    .refine(
      (ids) =>
        ids.length <= 50 &&
        ids.every((id) => /^[0-9a-f-]{36}$/i.test(id)) &&
        new Set(ids).size === ids.length,
      'Invalid tagIds',
    )
    .default([]),
})

export type ListQuery = z.output<typeof listQuerySchema>
