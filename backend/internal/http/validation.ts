import type { Context } from 'hono'
import { createMiddleware } from 'hono/factory'
import { attempt } from '../result/result'
import { apiError } from './error'
import type { AppEnv } from './types'

/** Preserve the API's media-type and malformed-JSON errors before schema validation. */
export const prepareJson = createMiddleware<AppEnv>(async (c, next) => {
  const contentType = c.req.header('content-type')?.split(';')[0]?.trim().toLowerCase()
  if (!contentType || !/^application\/(?:[\w.-]+\+)?json$/.test(contentType))
    return c.json(apiError('HTTP_ERROR', 'Content-Type must be application/json'), 415)
  // Hono caches the parsed body; sValidator reuses it rather than consuming it again.
  const body = await attempt(() => c.req.json<unknown>())
  if (body.code !== 0) return c.json(apiError('VALIDATION_ERROR', 'Invalid JSON body'), 400)
  await next()
})

/** Keep validation responses compatible, without echoing submitted passwords or data. */
export function validationHook(
  result: { success: true } | { success: false; error: readonly { message: string }[] },
  c: Pick<Context, 'json'>,
) {
  if (!result.success)
    return c.json(apiError('VALIDATION_ERROR', result.error[0]?.message ?? 'Invalid input'), 400)
}
