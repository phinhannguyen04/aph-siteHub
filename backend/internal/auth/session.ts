import { randomBytes } from 'node:crypto'
import { sign } from 'hono/jwt'
import type { CookieOptions } from 'hono/utils/cookie'
import type { AppConfig } from '../config/config'

export const sessionCookieName = 'admin_session'
const lifetimeSeconds = 8 * 60 * 60

/** Hono signs JWTs; the application contributes only its session claims. */
export async function createSession(secret: string, version: string) {
  const csrf = randomBytes(32).toString('base64url')
  const token = await sign(
    { sub: 'admin', exp: Math.floor(Date.now() / 1000) + lifetimeSeconds, csrf, version },
    secret,
    'HS256',
  )
  return { token, csrf }
}

export function sessionCookieOptions(config: Pick<AppConfig, 'cookieSecure'>): CookieOptions {
  return {
    httpOnly: true,
    sameSite: 'Strict',
    path: '/api',
    maxAge: lifetimeSeconds,
    secure: config.cookieSecure,
  }
}
