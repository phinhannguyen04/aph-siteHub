import { setCookie, deleteCookie } from 'hono/cookie'
import { sValidator } from '@hono/standard-validator'
import { Hono, type MiddlewareHandler } from 'hono'
import type { AppConfig } from '../config/config'
import { apiError } from '../http/error'
import { errorResponse } from '../http/response'
import type { AppEnv } from '../http/types'
import { validationHook } from '../http/validation'
import { loginSchema, changePasswordSchema } from './schema'
import { CredentialsService, verifyAdminPassword } from './service'
import type { LoginLimiter } from './limiter'
import { originMiddleware } from './middleware'
import { createSession, sessionCookieName, sessionCookieOptions } from './session'

export function authRoutes(
  config: AppConfig,
  credentials: CredentialsService,
  guard: MiddlewareHandler<AppEnv>,
  limiter: LoginLimiter,
) {
  const app = new Hono<AppEnv>()

  app.get('/session', guard, (c) => c.json({ csrfToken: c.get('session').csrf }))

  app.post(
    '/login',
    originMiddleware(config),
    sValidator('json', loginSchema, validationHook),
    limiter.middleware,
    async (c) => {
      const input = c.req.valid('json')
      const current = await credentials.current()
      if (current.code !== 0) return errorResponse(c, current.error)
      if (!(await verifyAdminPassword(input.password, current.data.password_hash))) {
        return c.json(apiError('UNAUTHORIZED', 'Incorrect password'), 401)
      }
      limiter.reset(c)
      const session = await createSession(config.sessionSecret, current.data.version)
      setCookie(c, sessionCookieName, session.token, sessionCookieOptions(config))
      return c.json({ csrfToken: session.csrf })
    },
  )

  app.post('/logout', guard, (c) => {
    deleteCookie(c, sessionCookieName, sessionCookieOptions(config))
    return c.json({ ok: true })
  })

  app.post(
    '/change-password',
    guard,
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
      const session = await createSession(config.sessionSecret, updated.data.version)
      setCookie(c, sessionCookieName, session.token, sessionCookieOptions(config))
      return c.json({ csrfToken: session.csrf })
    },
  )
  return app
}
