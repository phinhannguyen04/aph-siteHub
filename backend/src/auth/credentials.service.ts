import { Inject, Injectable } from '@nestjs/common'
import type { Surreal } from 'surrealdb'
import type { AppConfig } from '../config/app-config'
import { APP_CONFIG } from '../config/config.tokens'
import { DATABASE } from '../database/database.tokens'

export function verifyAdminPassword(password: string, hash: string) {
  return Bun.password.verify(password, hash).catch(() => false)
}

export interface Credential {
  password_hash: string
  version: string
}

@Injectable()
export class CredentialsService {
  constructor(
    @Inject(DATABASE) private readonly db: Surreal,
    @Inject(APP_CONFIG) private readonly config: AppConfig,
  ) {}

  async current(): Promise<Credential> {
    const [rows] = await this.db.query<[Credential[]]>(
      'SELECT password_hash, version FROM admin_credentials:primary',
    )
    if (rows[0]) return rows[0]
    if (!this.config.adminPasswordHash) {
      throw new Error('Initial administrator hash is missing; run the password reset command')
    }
    const version = crypto.randomUUID()
    try {
      await this.db.query(
        'CREATE admin_credentials:primary CONTENT { password_hash: $password_hash, version: $version }',
        { password_hash: this.config.adminPasswordHash, version },
      )
      return { password_hash: this.config.adminPasswordHash, version }
    } catch (error) {
      // Another instance may have created the singleton credential concurrently.
      const [current] = await this.db.query<[Credential[]]>(
        'SELECT password_hash, version FROM admin_credentials:primary',
      )
      if (current[0]) return current[0]
      throw error
    }
  }

  async replace(password: string, expectedVersion: string): Promise<Credential | null> {
    const password_hash = await Bun.password.hash(password, { algorithm: 'argon2id' })
    const version = crypto.randomUUID()
    const [rows] = await this.db.query<[Credential[]]>(
      'UPDATE admin_credentials:primary SET password_hash = $password_hash, version = $version WHERE version = $expectedVersion RETURN AFTER',
      { password_hash, version, expectedVersion },
    )
    return rows[0] ?? null
  }
}
