export interface AppConfig {
  databaseUrl: string
  adminPasswordHash?: string
  sessionSecret: string
  appOrigin: string
  appOrigins?: string[]
  cookieSecure: boolean
  port: number
}

export function readConfig(env = Bun.env): AppConfig {
  const required = (key: string) => {
    const value = env[key]
    if (!value) throw new Error(`Missing environment variable ${key}`)
    return value
  }
  const databaseUrl = required('DATABASE_URL')
  if (!['postgres:', 'postgresql:'].includes(URL.parse(databaseUrl)?.protocol ?? ''))
    throw new Error('DATABASE_URL must use postgres or postgresql')
  const sessionSecret = required('SESSION_SECRET')
  if (sessionSecret.length < 32) throw new Error('SESSION_SECRET must be at least 32 characters')
  const encodedHash = env.ADMIN_PASSWORD_HASH_BASE64
  const adminPasswordHash = encodedHash
    ? Buffer.from(encodedHash, 'base64').toString('utf8')
    : env.ADMIN_PASSWORD_HASH || undefined
  if (adminPasswordHash && !adminPasswordHash.startsWith('$argon2id$'))
    throw new Error('ADMIN_PASSWORD_HASH_BASE64 must contain a valid Argon2id hash')
  return {
    databaseUrl,
    adminPasswordHash,
    sessionSecret,
    appOrigin: new URL(required('APP_ORIGIN')).origin,
    appOrigins: (env.APP_ORIGINS || '')
      .split(',')
      .map((origin) => origin.trim())
      .filter(Boolean)
      .map((origin) => new URL(origin).origin),
    cookieSecure: env.COOKIE_SECURE !== 'false',
    port: Number(env.API_PORT || 3000),
  }
}
