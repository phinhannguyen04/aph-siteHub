import type { Context } from 'hono'
import { createMiddleware } from 'hono/factory'
import { jwt } from 'hono/jwt'
import { every, except } from 'hono/combine'
import { sValidator } from '@hono/standard-validator'
import { z } from 'zod'
import type { AppConfig } from '../config/config'
import { apiError } from '../http/error'
import { errorResponse } from '../http/response'
import type { AppEnv } from '../http/types'
import type { CredentialsService } from './service'
import { sessionCookieName } from './session'
import { sessionClaimsSchema } from './schema'

export function originMiddleware(config: AppConfig) {
  return sValidator(
    'header',
    z.object({ origin: z.enum([config.appOrigin, ...(config.appOrigins ?? [])]) }),
    async (result, c) => {
      if (!result.success) return c.json(apiError('FORBIDDEN', 'Invalid request origin'), 403)
    },
  )
}

export function sessionMiddleware(config: AppConfig, credentials: CredentialsService) {
  const credentialGuard = createMiddleware<AppEnv>(async (c, next) => {
    // Credential revocation is domain policy; Hono has already verified JWT signature/expiry.
    const claims = sessionClaimsSchema.safeParse(c.get('jwtPayload'))
    if (!claims.success) return c.json(apiError('UNAUTHORIZED', 'Please sign in'), 401)
    const current = await credentials.current()
    if (current.code !== 0) return errorResponse(c, current.error)
    if (claims.data.version !== current.data.version)
      return c.json(apiError('UNAUTHORIZED', 'Please sign in'), 401)
    c.set('session', { csrf: claims.data.csrf, version: claims.data.version })
    c.set('credential', current.data)
    await next()
  })
  const csrfTokenGuard = createMiddleware<AppEnv>(async (c, next) => {
    const schema = z.object({ 'x-csrf-token': z.literal(c.get('session').csrf) })
    return sValidator('header', schema, async (result, c: Context<AppEnv>) => {
      if (!result.success)
        return c.json(apiError('FORBIDDEN', 'Invalid session or request origin'), 403)
    })(c, next)
  })
  return every(
    jwt({ secret: config.sessionSecret, alg: 'HS256', cookie: sessionCookieName }),
    credentialGuard,
    except(
      (c) => ['GET', 'HEAD', 'OPTIONS'].includes(c.req.method),
      originMiddleware(config),
      csrfTokenGuard,
    ),
  )
}
