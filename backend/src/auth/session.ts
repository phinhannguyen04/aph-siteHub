import { attemptSync } from '../common/errors/result'
import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto'
import type { FastifyRequest } from 'fastify'
import type { AppConfig } from '../config/app-config'

const cookieName = 'admin_session'
const lifetimeSeconds = 8 * 60 * 60

function sign(text: string, secret: string): string {
  return createHmac('sha256', secret).update(text).digest('base64url')
}

export function createSession(secret: string, version: string): { token: string; csrf: string } {
  const csrf = randomBytes(32).toString('base64url')
  const payload = Buffer.from(
    JSON.stringify({ exp: Date.now() + lifetimeSeconds * 1000, csrf, version }),
  ).toString('base64url')
  return { token: `${payload}.${sign(payload, secret)}`, csrf }
}

export function readSession(
  token: string | undefined,
  secret: string,
): { csrf: string; version: string } | null {
  if (!token) return null
  const [payload, signature, extra] = token.split('.')

  if (!payload || !signature || extra) return null
  const expected = Buffer.from(sign(payload, secret))
  const actual = Buffer.from(signature)

  if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) return null
  const parsed = attemptSync(
    () => JSON.parse(Buffer.from(payload, 'base64url').toString()) as unknown,
  )
  if (parsed.code !== 0 || typeof parsed.data !== 'object' || parsed.data === null) return null
  const data = parsed.data as { exp?: unknown; csrf?: unknown; version?: unknown }
  if (
    typeof data.exp !== 'number' ||
    data.exp <= Date.now() ||
    typeof data.csrf !== 'string' ||
    typeof data.version !== 'string'
  )
    return null
  return { csrf: data.csrf, version: data.version }
}

export function getSession(request: FastifyRequest, secret: string) {
  const cookie = request.headers.cookie
    ?.split(';')
    .map((value) => value.trim())
    .find((value) => value.startsWith(`${cookieName}=`))
  return readSession(cookie?.slice(cookieName.length + 1), secret)
}

export function sessionCookie(token: string, config: AppConfig): string {
  return `${cookieName}=${token}; HttpOnly; SameSite=Strict; Path=/api; Max-Age=${lifetimeSeconds}${config.cookieSecure ? '; Secure' : ''}`
}

export function clearSessionCookie(config: AppConfig): string {
  return `${cookieName}=; HttpOnly; SameSite=Strict; Path=/api; Max-Age=0${config.cookieSecure ? '; Secure' : ''}`
}

export function sameOrigin(request: FastifyRequest, config: AppConfig): boolean {
  return [config.appOrigin, ...(config.appOrigins || [])].includes(request.headers.origin || '')
}

export function validCsrf(request: FastifyRequest, csrf: string): boolean {
  const sent = request.headers['x-csrf-token']
  if (typeof sent !== 'string') return false
  const a = Buffer.from(sent)
  const b = Buffer.from(csrf)
  return a.length === b.length && timingSafeEqual(a, b)
}
