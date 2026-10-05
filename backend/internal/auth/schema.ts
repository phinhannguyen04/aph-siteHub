import { z } from 'zod'

export const loginSchema = z.strictObject({
  password: z
    .string({ error: 'Password is required' })
    .min(1, 'Password is required')
    .max(256, 'Password must be at most 256 characters'),
})

export const changePasswordSchema = z
  .strictObject({
    currentPassword: z
      .string({ error: 'Current password is required' })
      .min(1, 'Current password is required')
      .max(256, 'Current password must be at most 256 characters'),
    newPassword: z
      .string({ error: 'Invalid new password' })
      .min(12, 'New password must be between 12 and 256 characters')
      .max(256, 'New password must be between 12 and 256 characters')
      .regex(/\S/, 'New password cannot be blank'),
  })
  .refine(
    (input) => input.currentPassword !== input.newPassword,
    'New password must differ from the current password',
  )

export const sessionClaimsSchema = z.object({
  sub: z.literal('admin'),
  exp: z.number().int().positive(),
  csrf: z.string().min(1),
  version: z.string().min(1),
})
