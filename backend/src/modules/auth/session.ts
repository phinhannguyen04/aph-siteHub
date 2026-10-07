import {
  attemptSync,
  success,
  unexpectedFailure,
  type ServiceResult,
} from '../../common/errors/result'
import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto'
import type { FastifyRequest } from 'fastify'
import type { AppConfig } from '../../config/app.config'

const cookieName = 'admin_session'

const lifetimeSeconds = 8 * 60 * 60

/** Sign the encoded session payload with HMAC-SHA256 using the session secret. */
function sign(text: string, secret: string): string {
  return createHmac('sha256', secret).update(text).digest('base64url')
}

/**
 * Create an eight-hour signed session containing a random CSRF token and the current
 * credential version.
 */
export function createSession(
  secret: string,
  version: string,
): ServiceResult<{ token: string; csrf: string }> {
  const result = attemptSync(() => {
    const csrf = randomBytes(32).toString('base64url')
    const payload = Buffer.from(
      JSON.stringify({ exp: Date.now() + lifetimeSeconds * 1000, csrf, version }),
    ).toString('base64url')

    return { token: `${payload}.${sign(payload, secret)}`, csrf }
  })

  if (result.code !== 0) {
    return unexpectedFailure(result.error)
  }

  return success(result.data)
}

/**
 * Validate a session signature, payload, and expiration, returning null for an invalid
 * or expired token.
 */
export function readSession(
  token: string | undefined,
  secret: string,
): { csrf: string; version: string } | null {
  if (!token) {
    return null
  }

  const [payload, signature, extra] = token.split('.')

  if (!payload || !signature || extra) {
    return null
  }

  const expected = Buffer.from(sign(payload, secret))
  const actual = Buffer.from(signature)

  if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) {
    return null
  }

  const parsed = attemptSync(
    () => JSON.parse(Buffer.from(payload, 'base64url').toString()) as unknown,
  )

  if (parsed.code !== 0 || typeof parsed.data !== 'object' || parsed.data === null) {
    return null
  }

  const data = parsed.data as { exp?: unknown; csrf?: unknown; version?: unknown }

  if (
    typeof data.exp !== 'number' ||
    data.exp <= Date.now() ||
    typeof data.csrf !== 'string' ||
    typeof data.version !== 'string'
  ) {
    return null
  }

  return { csrf: data.csrf, version: data.version }
}

/** Extract the administrator session cookie and validate its signed token. */
export function getSession(request: FastifyRequest, secret: string) {
  const cookie = request.headers.cookie
    ?.split(';')
    .map((value) => value.trim())
    .find((value) => value.startsWith(`${cookieName}=`))

  return readSession(cookie?.slice(cookieName.length + 1), secret)
}

/** Build the session cookie with HttpOnly, SameSite, lifetime, and the configured Secure flag. */
export function sessionCookie(token: string, config: AppConfig): string {
  return `${cookieName}=${token}; HttpOnly; SameSite=Strict; Path=/api; Max-Age=${lifetimeSeconds}${config.cookieSecure ? '; Secure' : ''}`
}

/**
 * Build an expired session cookie with the same path and security settings as the
 * original cookie.
 */
export function clearSessionCookie(config: AppConfig): string {
  return `${cookieName}=; HttpOnly; SameSite=Strict; Path=/api; Max-Age=0${config.cookieSecure ? '; Secure' : ''}`
}

/** Check whether the request Origin exactly matches one of the configured browser origins. */
export function sameOrigin(request: FastifyRequest, config: AppConfig): boolean {
  return [config.appOrigin, ...(config.appOrigins || [])].includes(request.headers.origin || '')
}

/** Compare the submitted CSRF header with the session token using a timing-safe comparison. */
export function validCsrf(request: FastifyRequest, csrf: string): boolean {
  const sent = request.headers['x-csrf-token']

  if (typeof sent !== 'string') {
    return false
  }

  const a = Buffer.from(sent)
  const b = Buffer.from(csrf)

  return a.length === b.length && timingSafeEqual(a, b)
}
