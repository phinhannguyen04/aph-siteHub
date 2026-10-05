import { createMiddleware } from 'hono/factory'
import type { AppConfig } from '../config/config'
import { apiError } from '../http/error'
import { errorResponse } from '../http/response'
import type { AppEnv } from '../http/types'
import type { CredentialsService } from './service'
import { getSession, sameOrigin, validCsrf } from './session'

export function sessionMiddleware(config: AppConfig, credentials: CredentialsService) {
  return createMiddleware<AppEnv>(async (c, next) => {
    const session = getSession(c.req.raw, config.sessionSecret)
    if (!session) return c.json(apiError('UNAUTHORIZED', 'Please sign in'), 401)
    const current = await credentials.current()
    if (current.code !== 0) return errorResponse(c, current.error)
    if (session.version !== current.data.version)
      return c.json(apiError('UNAUTHORIZED', 'Please sign in'), 401)
    if (
      c.req.method !== 'GET' &&
      (!sameOrigin(c.req.raw, config) || !validCsrf(c.req.raw, session.csrf))
    )
      return c.json(apiError('FORBIDDEN', 'Invalid session or request origin'), 403)
    c.set('session', session)
    c.set('credential', current.data)
    await next()
  })
}
