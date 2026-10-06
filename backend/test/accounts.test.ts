import 'reflect-metadata'
import { describe, expect, test } from 'bun:test'
import { plainToInstance } from 'class-transformer'
import { validate } from 'class-validator'
import { httpData, serviceFailure, success } from '../src/common/errors/result'
import type { AppConfig } from '../src/config/app.config'
import { readConfig } from '../src/config/app.config'
import { AccountSecretService } from '../src/modules/accounts/account-secret.service'
import { toAccount } from '../src/modules/accounts/account.mapper'
import { AccountsRepository } from '../src/modules/accounts/accounts.repository'
import { AccountsService } from '../src/modules/accounts/accounts.service'
import { AccountDto } from '../src/modules/accounts/dto/account.dto'
import { UpdateAccountDto } from '../src/modules/accounts/dto/update-account.dto'
import type { AccountEntity } from '../src/modules/accounts/entities/account.entity'
import type { Repository } from 'typeorm'

const secrets = new AccountSecretService({ accountEncryptionKey: 'ab'.repeat(32) } as AppConfig)
const row: AccountEntity = {
  id: 'account-id',
  provider: 'provider',
  login_name: 'login',
  external_account_id: 'external-id',
  email: 'user@example.com',
  password: 'password',
  secret_key_encrypted: 'encrypted',
  is_limit: false,
  created_at: new Date('2026-10-06T00:00:00Z'),
}

describe('account secrets', () => {
  test('round trips Unicode keys, uses fresh nonces and binds ciphertext to the account', async () => {
    const value = 'secret-🔑-khóa'
    const first = httpData(await secrets.encrypt(row.id, value))
    const second = httpData(await secrets.encrypt(row.id, value))
    expect(first).not.toBe(second)
    expect(first).not.toContain(value)
    expect(httpData(await secrets.decrypt(row.id, first))).toBe(value)
    expect((await secrets.decrypt('different-account', first)).code).toBe(1)
    expect((await secrets.decrypt(row.id, first.replace(/^v1\./, 'v2.'))).code).toBe(1)
    const parts = first.split('.')
    parts[2] = Buffer.alloc(16).toString('base64url')
    expect((await secrets.decrypt(row.id, parts.join('.'))).code).toBe(1)
    const wrongKey = new AccountSecretService({
      accountEncryptionKey: 'cd'.repeat(32),
    } as AppConfig)
    expect((await wrongKey.decrypt(row.id, first)).code).toBe(1)
  })

  test('fails explicitly when the encryption key is missing or invalid', async () => {
    for (const accountEncryptionKey of [undefined, 'short']) {
      const service = new AccountSecretService({ accountEncryptionKey } as AppConfig)
      const result = await service.encrypt(row.id, 'secret')
      expect(result.code).toBe(1)
      if (result.code !== 0) expect(result.error.code).toBe('CONFIGURATION_ERROR')
    }
    expect(
      readConfig({
        DATABASE_URL: 'postgres://localhost/test',
        SESSION_SECRET: 's'.repeat(32),
        APP_ORIGIN: 'http://localhost',
        ACCOUNT_ENCRYPTION_KEY: 'invalid',
      }).code,
    ).toBe(1)
  })
})

test('account mapper excludes password and encrypted secret even on creation', () => {
  const mapped = toAccount(row)
  expect(mapped.login_name).toBe('login')
  expect(mapped.created_at).toBe('2026-10-06T00:00:00.000Z')
  expect(mapped).not.toHaveProperty('password')
  expect(mapped).not.toHaveProperty('secret_key_encrypted')
})

test('account DTOs reject blank secrets, null updates and empty patches', async () => {
  const input = {
    provider: 'p',
    login_name: 'login',
    external_account_id: 'external',
    email: 'user@example.com',
    password: 'password',
    secret_key: 'secret',
  }
  expect(await validate(plainToInstance(AccountDto, input))).toHaveLength(0)
  expect(
    await validate(plainToInstance(AccountDto, { ...input, secret_key: ' ' })),
  ).not.toHaveLength(0)
  expect(new UpdateAccountDto().assertHasChanges().code).toBe(1)
  for (const field of ['password', 'secret_key', 'is_limit']) {
    expect(await validate(plainToInstance(UpdateAccountDto, { [field]: null }))).not.toHaveLength(0)
  }
  expect(await validate(plainToInstance(UpdateAccountDto, { is_limit: false }))).toHaveLength(0)
})

test('account deletion uses the affected row count', async () => {
  for (const affected of [0, 1]) {
    const repository = new AccountsRepository({
      delete: async () => ({ affected }),
    } as unknown as Repository<AccountEntity>)
    expect(httpData(await repository.delete('id'))).toBe(affected === 1)
  }
})

test('account services return missing, conflict and repository errors', async () => {
  const repository = {
    findById: async () => success(null),
    findWithSecretById: async () => success(null),
    delete: async () => success(false),
    update: async () => success(null),
    findByProviderAndExternalId: async () => success(true),
    list: async () => serviceFailure('INTERNAL_ERROR', 'Database unavailable', 500),
  } as unknown as AccountsRepository
  const service = new AccountsService(repository, secrets)
  for (const result of [
    await service.findById('missing'),
    await service.getSecretKey('missing'),
    await service.delete('missing'),
    await service.update('missing', plainToInstance(UpdateAccountDto, { is_limit: true })),
  ]) {
    expect(result.code).toBe(1)
    if (result.code !== 0) expect(result.error.status).toBe(404)
  }
  const conflict = await service.create(
    plainToInstance(AccountDto, { provider: 'p', external_account_id: 'external' }),
  )
  expect(conflict.code).toBe(1)
  if (conflict.code !== 0) expect(conflict.error.status).toBe(409)
  expect(await service.list()).toEqual(
    serviceFailure('INTERNAL_ERROR', 'Database unavailable', 500),
  )
})
