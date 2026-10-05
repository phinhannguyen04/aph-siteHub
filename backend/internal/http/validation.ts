import type { Context, Env } from 'hono'
import type { Hook } from '@hono/standard-validator'

type ValidationResult = Parameters<Hook<unknown, Env, string>>[0]

/** Use sValidator's documented hook to adapt errors to the application's API envelope. */
export function validationHook(result: ValidationResult, c: Pick<Context, 'json'>) {
  if (!result.success)
    return c.json(
      { error: { code: 'VALIDATION_ERROR', message: result.error[0]?.message ?? 'Invalid input' } },
      400,
    )
}
