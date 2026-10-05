import { Inject, Injectable } from '@nestjs/common'
import type { AppConfig } from '../config/app-config'
import { APP_CONFIG } from '../config/config.tokens'
import { DATABASE } from '../database/database.tokens'
import type { Database } from '../database/client'
import { newRepository, type Repository } from './repository'
import { attempt, operation, unexpectedFailure, type ServiceResult } from '../common/errors/result'
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
  private readonly repository: Repository
  constructor(
    @Inject(DATABASE) db: Database,
    @Inject(APP_CONFIG) private readonly config: AppConfig,
  ) {
    this.repository = newRepository(db)
  }
  current(): Promise<ServiceResult<Credential>> {
    return operation(async () => {
      const found = await this.repository.find()
      if (found.code !== 0) return found
      if (found.data) return { code: 0, data: found.data }
      if (!this.config.adminPasswordHash)
        return unexpectedFailure(
          new Error('Initial administrator hash is missing; run the password reset command'),
        )
      return this.repository.initialize({
        password_hash: this.config.adminPasswordHash,
        version: crypto.randomUUID(),
      })
    })
  }
  replace(password: string, expectedVersion: string): Promise<ServiceResult<Credential | null>> {
    return operation(async () =>
      this.repository.replace(
        {
          password_hash: await Bun.password.hash(password, { algorithm: 'argon2id' }),
          version: crypto.randomUUID(),
        },
        expectedVersion,
      ),
    )
  }
}
