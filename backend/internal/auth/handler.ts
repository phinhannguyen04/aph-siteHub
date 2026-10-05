import { sValidator } from '@hono/standard-validator'
import { Hono, type MiddlewareHandler } from 'hono'
import type { AppConfig } from '../config/config'
import { apiError } from '../http/error'
import { errorResponse } from '../http/response'
import type { AppEnv } from '../http/types'
import { prepareJson, validationHook } from '../http/validation'
import { loginSchema, changePasswordSchema } from './schema'
import { CredentialsService, verifyAdminPassword } from './service'
import { createLoginLimiter } from './limiter'
import { clearSessionCookie, createSession, sameOrigin, sessionCookie } from './session'

export function authRoutes(
  config: AppConfig,
  credentials: CredentialsService,
  guard: MiddlewareHandler<AppEnv>,
) {
  const app = new Hono<AppEnv>()
  const limiter = createLoginLimiter()

  app.get('/session', guard, (c) => c.json({ csrfToken: c.get('session').csrf }))

  app.post('/login', prepareJson, sValidator('json', loginSchema, validationHook), async (c) => {
    const input = c.req.valid('json')
    if (!sameOrigin(c.req.raw, config))
      return c.json(apiError('FORBIDDEN', 'Invalid request origin'), 403)
    const key =
      c.req.header('x-real-ip') || c.env?.server?.requestIP(c.req.raw)?.address || 'unknown'
    if (limiter.isBlocked(key))
      return c.json(apiError('RATE_LIMITED', 'Please try again in 15 minutes'), 429)
    const current = await credentials.current()
    if (current.code !== 0) return errorResponse(c, current.error)
    if (!(await verifyAdminPassword(input.password, current.data.password_hash))) {
      limiter.recordFailure(key)
      return c.json(apiError('UNAUTHORIZED', 'Incorrect password'), 401)
    }
    limiter.reset(key)
    const session = createSession(config.sessionSecret, current.data.version)
    c.header('set-cookie', sessionCookie(session.token, config))
    return c.json({ csrfToken: session.csrf })
  })

  app.post('/logout', guard, (c) => {
    c.header('set-cookie', clearSessionCookie(config))
    return c.json({ ok: true })
  })

  app.post(
    '/change-password',
    guard,
    prepareJson,
    sValidator('json', changePasswordSchema, validationHook),
    async (c) => {
      const input = c.req.valid('json')
      const current = c.get('credential')
      if (!(await verifyAdminPassword(input.currentPassword, current.password_hash)))
        return c.json(apiError('UNAUTHORIZED', 'Incorrect current password'), 401)
      const updated = await credentials.replace(input.newPassword, current.version)
      if (updated.code !== 0) return errorResponse(c, updated.error)
      if (!updated.data)
        return c.json(apiError('CONFLICT', 'The password was changed. Please try again'), 409)
      const session = createSession(config.sessionSecret, updated.data.version)
      c.header('set-cookie', sessionCookie(session.token, config))
      return c.json({ csrfToken: session.csrf })
    },
  )
  return app
}
