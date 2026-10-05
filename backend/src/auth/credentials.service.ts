import {
  attempt,
  operation,
  success,
  unexpectedFailure,
  type ServiceResult,
} from '../common/errors/result'
import { Inject, Injectable } from '@nestjs/common'
import type { AppConfig } from '../config/app-config'
import { APP_CONFIG } from '../config/config.tokens'
import { ORM } from '../database/database.tokens'
import type { SiteOrm } from '../database/database.module'

export function verifyAdminPassword(password: string, hash: string) {
  return attempt(() => Bun.password.verify(password, hash)).then(
    (result) => result.code === 0 && result.data,
  )
}

export interface Credential {
  password_hash: string
  version: string
}

@Injectable()
export class CredentialsService {
  constructor(
    @Inject(ORM) private readonly orm: SiteOrm,
    @Inject(APP_CONFIG) private readonly config: AppConfig,
  ) {}

  async current(): Promise<ServiceResult<Credential>> {
    return operation<Credential>(async () => {
      const rows = await this.orm.select('admin_credentials', 'primary')
      if (rows[0]) return success(rows[0])
      const passwordHash = this.config.adminPasswordHash
      if (!passwordHash) {
        return unexpectedFailure(
          new Error('Initial administrator hash is missing; run the password reset command'),
        )
      }
      const version = crypto.randomUUID()
      const created = await attempt(() =>
        this.orm.create('admin_credentials', 'primary').content({
          password_hash: passwordHash,
          version,
        }),
      )
      if (created.code !== 0) {
        // Another instance may have created the singleton credential concurrently.
        const current = await this.orm.select('admin_credentials', 'primary')
        if (current[0]) return success(current[0])
        return unexpectedFailure(created.error)
      }
      return success({ password_hash: passwordHash, version })
    })
  }

  async replace(
    password: string,
    expectedVersion: string,
  ): Promise<ServiceResult<Credential | null>> {
    return operation(async () => {
      const password_hash = await Bun.password.hash(password, { algorithm: 'argon2id' })
      const version = crypto.randomUUID()
      const rows = await this.orm
        .update('admin_credentials', 'primary')
        .where((credential) => credential.version.eq(expectedVersion))
        .set({ password_hash, version })
        .return('after')
      return success(rows[0] ?? null)
    })
  }
}
