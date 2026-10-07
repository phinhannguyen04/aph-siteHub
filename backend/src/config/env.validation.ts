import { serviceFailure, success, type ServiceResult } from '../common/errors/result'
import type { AppConfig } from './app.config'

/**
 * Validate database, session, encryption, origin, and port settings and apply defaults
 * for optional values.
 */
export function validateEnv(env: Record<string, string | undefined>): ServiceResult<AppConfig> {
  for (const key of ['DATABASE_URL', 'SESSION_SECRET', 'APP_ORIGIN']) {
    if (!env[key]) {
      return serviceFailure('CONFIGURATION_ERROR', `Missing environment variable ${key}`, 500)
    }
  }
  const databaseUrl = env.DATABASE_URL!

  if (!['postgres:', 'postgresql:'].includes(URL.parse(databaseUrl)?.protocol ?? '')) {
    return serviceFailure(
      'CONFIGURATION_ERROR',
      'DATABASE_URL must use postgres or postgresql',
      500,
    )
  }

  const sessionSecret = env.SESSION_SECRET!

  if (sessionSecret.length < 32) {
    return serviceFailure(
      'CONFIGURATION_ERROR',
      'SESSION_SECRET must be at least 32 characters',
      500,
    )
  }

  const accountEncryptionKey = env.ACCOUNT_ENCRYPTION_KEY || undefined

  if (accountEncryptionKey && !/^[0-9a-f]{64}$/i.test(accountEncryptionKey)) {
    return serviceFailure(
      'CONFIGURATION_ERROR',
      'ACCOUNT_ENCRYPTION_KEY must contain 64 hexadecimal characters',
      500,
    )
  }

  const encodedHash = env.ADMIN_PASSWORD_HASH_BASE64
  const adminPasswordHash = encodedHash
    ? Buffer.from(encodedHash, 'base64').toString('utf8')
    : env.ADMIN_PASSWORD_HASH || undefined

  if (adminPasswordHash && !adminPasswordHash.startsWith('$argon2id$')) {
    return serviceFailure(
      'CONFIGURATION_ERROR',
      'ADMIN_PASSWORD_HASH_BASE64 must contain a valid Argon2id hash',
      500,
    )
  }

  const appOrigin = URL.parse(env.APP_ORIGIN!)

  if (!appOrigin || !['http:', 'https:'].includes(appOrigin.protocol)) {
    return serviceFailure(
      'CONFIGURATION_ERROR',
      'APP_ORIGIN must be a valid HTTP or HTTPS URL',
      500,
    )
  }

  const appOrigins: string[] = []
  for (const value of (env.APP_ORIGINS || '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean)) {
    const origin = URL.parse(value)

    if (!origin || !['http:', 'https:'].includes(origin.protocol)) {
      return serviceFailure(
        'CONFIGURATION_ERROR',
        'APP_ORIGINS must contain valid HTTP or HTTPS URLs',
        500,
      )
    }

    appOrigins.push(origin.origin)
  }
  const port = Number(env.API_PORT || 3000)

  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    return serviceFailure(
      'CONFIGURATION_ERROR',
      'API_PORT must be an integer between 1 and 65535',
      500,
    )
  }

  return success({
    databaseUrl,
    adminPasswordHash,
    sessionSecret,
    accountEncryptionKey,
    appOrigin: appOrigin.origin,
    appOrigins,
    cookieSecure: env.COOKIE_SECURE !== 'false',
    port,
  })
}
