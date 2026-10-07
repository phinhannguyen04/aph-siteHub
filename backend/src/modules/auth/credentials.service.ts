import { Inject, Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { AdminCredentialEntity } from './entities/admin-credential.entity'
import type { AppConfig } from '../../config/app.config'
import { APP_CONFIG } from '../../config/config.tokens'
import { query } from '../../database/error'
import {
  attempt,
  operation,
  success,
  unexpectedFailure,
  type ServiceResult,
} from '../../common/errors/result'

/**
 * Verify a password against its stored hash and return verification errors separately
 * from a password mismatch.
 */
export async function verifyAdminPassword(
  password: string,
  hash: string,
): Promise<ServiceResult<boolean>> {
  const result = await attempt(() => Bun.password.verify(password, hash))

  if (result.code !== 0) {
    return unexpectedFailure(result.error)
  }

  return success(result.data)
}

export interface Credential {
  password_hash: string
  version: string
}

@Injectable()
export class CredentialsService {
  /**
   * Receive the administrator credential repository and configuration used for
   * first-time initialization.
   */
  constructor(
    @InjectRepository(AdminCredentialEntity)
    private readonly credentials: Repository<AdminCredentialEntity>,
    @Inject(APP_CONFIG) private readonly config: AppConfig,
  ) {}

  /**
   * Read administrator credentials or initialize them from configuration without
   * overwriting an existing record.
   */
  current(): Promise<ServiceResult<Credential>> {
    return operation(async () => {
      const find = () =>
        this.credentials.findOne({
          where: { id: 'primary' },
          select: { password_hash: true, version: true },
        })
      const found = await query(find)

      if (found.code !== 0) {
        return found
      }

      if (found.data) {
        return success(found.data)
      }

      if (!this.config.adminPasswordHash) {
        return unexpectedFailure(
          new Error('Initial administrator hash is missing; run the password reset command'),
        )
      }

      return query(async () => {
        await this.credentials
          .createQueryBuilder()
          .insert()
          .values({
            id: 'primary',
            password_hash: this.config.adminPasswordHash!,
            version: crypto.randomUUID(),
          })
          .orIgnore()
          .execute()

        return (await find())!
      })
    })
  }

  /**
   * Hash a new password and replace credentials only if their version still matches,
   * returning null on a concurrent change.
   */
  replace(password: string, expectedVersion: string): Promise<ServiceResult<Credential | null>> {
    return operation(async () => {
      const credential = {
        password_hash: await Bun.password.hash(password, { algorithm: 'argon2id' }),
        version: crypto.randomUUID(),
      }

      return query(async () => {
        const result = await this.credentials
          .createQueryBuilder()
          .update()
          .set(credential)
          .where('id = :id AND version = :version', { id: 'primary', version: expectedVersion })
          .returning(['password_hash', 'version'])
          .execute()

        return (result.raw as Credential[])[0] ?? null
      })
    })
  }
}
