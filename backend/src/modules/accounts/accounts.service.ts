import { Injectable } from '@nestjs/common'
import { operation, serviceFailure, success, type ServiceResult } from '../../common/errors/result'
import type { AccountStats } from './account.interface'
import type { AccountResponse } from './account-response.interface'
import { toAccount } from './account.mapper'
import { AccountsRepository } from './accounts.repository'
import { AccountSecretService } from './account-secret.service'
import type { AccountDto } from './dto/account.dto'
import type { UpdateAccountDto } from './dto/update-account.dto'
import type { AccountEntity } from './entities/account.entity'

@Injectable()
export class AccountsService {
  /** Receive the account repository and the service encrypting and decrypting account secrets. */
  constructor(
    private readonly accounts: AccountsRepository,
    private readonly secrets: AccountSecretService,
  ) {}

  /** Map stored accounts to public response records and propagate repository failures. */
  async list(): Promise<ServiceResult<AccountResponse[]>> {
    const result = await this.accounts.list()

    if (result.code !== 0) {
      return result
    }

    return success(result.data.map(toAccount))
  }

  /** Load and map one account, returning a not-found failure when its ID does not exist. */
  async findById(id: string): Promise<ServiceResult<AccountResponse>> {
    const result = await this.accounts.findById(id)

    if (result.code !== 0) {
      return result
    }

    if (!result.data) {
      return serviceFailure('NOT_FOUND', 'Account not found', 404)
    }

    return success(toAccount(result.data))
  }

  /** Retrieve overall and per-provider account counts grouped by limit status. */
  getStats(): Promise<ServiceResult<AccountStats>> {
    return this.accounts.getStats()
  }

  /**
   * Reject duplicate provider identities, generate an ID, encrypt the secret, and
   * persist the new account.
   */
  create(input: AccountDto): Promise<ServiceResult<AccountResponse>> {
    return operation(async () => {
      const exists = await this.accounts.findByProviderAndExternalId(
        input.provider,
        input.external_account_id,
      )

      if (exists.code !== 0) {
        return exists
      }

      if (exists.data) {
        return serviceFailure(
          'CONFLICT',
          'An account with this provider and external ID already exists',
          409,
        )
      }

      const id = crypto.randomUUID()
      const secret = await this.secrets.encrypt(id, input.secret_key)

      if (secret.code !== 0) {
        return secret
      }

      const result = await this.accounts.create({
        id,
        provider: input.provider,
        login_name: input.login_name,
        external_account_id: input.external_account_id,
        email: input.email,
        password: input.password,
        secret_key_encrypted: secret.data,
        is_limit: input.is_limit ?? false,
        created_at: input.created_at ? new Date(input.created_at) : new Date(),
      })

      if (result.code !== 0) {
        return result
      }

      return success(toAccount(result.data))
    })
  }

  /**
   * Apply supplied credential or limit changes, encrypt a replacement secret, and
   * return public account fields.
   */
  update(
    id: string,
    input: Pick<UpdateAccountDto, 'password' | 'secret_key' | 'is_limit'>,
  ): Promise<ServiceResult<AccountResponse>> {
    return operation(async () => {
      if (
        input.password === undefined &&
        input.secret_key === undefined &&
        input.is_limit === undefined
      ) {
        return serviceFailure(
          'VALIDATION_ERROR',
          'Provide at least one account field to update',
          400,
        )
      }

      const changes: Partial<
        Pick<AccountEntity, 'password' | 'secret_key_encrypted' | 'is_limit'>
      > = {}

      if (input.password !== undefined) {
        changes.password = input.password
      }

      if (input.is_limit !== undefined) {
        changes.is_limit = input.is_limit
      }

      if (input.secret_key !== undefined) {
        const secret = await this.secrets.encrypt(id, input.secret_key)

        if (secret.code !== 0) {
          return secret
        }

        changes.secret_key_encrypted = secret.data
      }

      const result = await this.accounts.update(id, changes)

      if (result.code !== 0) {
        return result
      }

      if (!result.data) {
        return serviceFailure('NOT_FOUND', 'Account not found', 404)
      }

      return success(toAccount(result.data))
    })
  }

  /**
   * Explicitly load the encrypted secret and decrypt it using the account ID as
   * authenticated data.
   */
  async getSecretKey(id: string): Promise<ServiceResult<string>> {
    const result = await this.accounts.findWithSecretById(id)

    if (result.code !== 0) {
      return result
    }

    if (!result.data) {
      return serviceFailure('NOT_FOUND', 'Account not found', 404)
    }

    return this.secrets.decrypt(id, result.data.secret_key_encrypted)
  }

  /** Delete an account and distinguish a missing record from a successful deletion. */
  async delete(id: string): Promise<ServiceResult<void>> {
    const result = await this.accounts.delete(id)

    if (result.code !== 0) {
      return result
    }

    if (!result.data) {
      return serviceFailure('NOT_FOUND', 'Account not found', 404)
    }

    return success(undefined)
  }
}
