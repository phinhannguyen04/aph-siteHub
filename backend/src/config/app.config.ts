import type { ServiceResult } from '../common/errors/result'
import { validateEnv } from './env.validation'

export interface AppConfig {
  databaseUrl: string
  adminPasswordHash?: string
  accountEncryptionKey?: string
  sessionSecret: string
  appOrigin: string
  appOrigins?: string[]
  cookieSecure: boolean
  port: number
}

export function readConfig(env = Bun.env): ServiceResult<AppConfig> {
  return validateEnv(env)
}
