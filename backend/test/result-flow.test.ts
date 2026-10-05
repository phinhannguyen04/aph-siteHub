import { describe, expect, mock, spyOn, test } from 'bun:test'
import * as configModule from '../src/config/app-config'
import * as databaseModule from '../src/database/client'
import { normalizeName, normalizeUrl } from '../src/websites/website-normalization'
import {
  normalizeTagName,
  normalizeTagDescription,
  normalizeTagColor,
} from '../src/tags/tag-normalization'
import { parseListQuery } from '../src/websites/list-query'
import { UpdateWebsiteDto } from '../src/websites/dto/update-website.dto'
import { ChangePasswordDto } from '../src/auth/dto/change-password.dto'
import { verifyAdminPassword } from '../src/auth/credentials.service'
import { backfillWebsiteSearch } from '../src/websites/search-backfill'
import { runWithDatabase } from '../src/cli/run-with-database'
import { createApp } from '../src/app.factory'
import {
  httpData,
  serviceFailure,
  success,
  unexpectedFailure,
  type ServiceResult,
} from '../src/common/errors/result'
import type { Database } from '../src/database/client'

const env = {
  DATABASE_URL: 'postgresql://unused/test',
  SESSION_SECRET: 'test-secret-with-at-least-thirty-two-characters',
  APP_ORIGIN: 'http://localhost:8111',
}

describe('validation returns errors as values', () => {
  test('configuration errors identify missing and malformed settings', () => {
    for (const invalid of [
      { DATABASE_URL: '' },
      { DATABASE_URL: 'http://example.com' },
      { SESSION_SECRET: 'short' },
      { ADMIN_PASSWORD_HASH_BASE64: 'invalid' },
      { APP_ORIGIN: 'broken' },
      { APP_ORIGINS: 'https://ok.example,broken' },
      { API_PORT: 'NaN' },
      { API_PORT: '0' },
      { API_PORT: '65536' },
    ]) {
      const result = configModule.readConfig({ ...env, ...invalid } as typeof Bun.env)
      expect(result.code).toBe(1)
      if (result.code !== 0) expect(result.error.code).toBe('CONFIGURATION_ERROR')
    }
    expect(configModule.readConfig(env as typeof Bun.env).code).toBe(0)
  })
  test('website and tag normalization expose validation errors without throwing', () => {
    const results = [
      normalizeName(' '),
      normalizeName('a'.repeat(161)),
      normalizeUrl(null),
      normalizeUrl('javascript:alert(1)'),
      normalizeTagName('#'),
      normalizeTagName('a'.repeat(65)),
      normalizeTagDescription('a'.repeat(241)),
      normalizeTagColor('red'),
    ]
    for (const result of results) {
      expect(result.code).toBe(1)
      if (result.code !== 0) expect(result.error.code).toBe('VALIDATION_ERROR')
    }
    expect(normalizeTagName(' ##Team ')).toEqual(success('Team'))
    expect(normalizeTagDescription(undefined)).toEqual(success(''))
    expect(normalizeTagColor('#AABBCC')).toEqual(success('#aabbcc'))
  })
  test('query parsing and cross-field validation return actionable failures', () => {
    for (const query of [
      { extra: 'x' },
      { page: '0' },
      { pageSize: '49' },
      { search: [] },
      { tagIds: 'bad' },
    ]) {
      const result = parseListQuery(query)
      expect(result.code).toBe(1)
      if (result.code !== 0) expect(result.error.status).toBe(400)
    }
    expect(parseListQuery({})).toEqual(success({ page: 1, pageSize: 12, search: '', tagIds: [] }))
    expect(new UpdateWebsiteDto().assertHasChanges().code).toBe(1)
    const password = Object.assign(new ChangePasswordDto(), {
      currentPassword: 'same',
      newPassword: 'same',
    })
    expect(password.assertDifferent().code).toBe(1)
  })
})

describe('infrastructure result propagation', () => {
  test('password verification distinguishes library failure from a wrong password', async () => {
    const hash = await Bun.password.hash('correct-password', { algorithm: 'argon2id' })
    expect(await verifyAdminPassword('wrong', hash)).toEqual(success(false))
    const cause = new Error('Password verifier unavailable')
    const verifier = spyOn(Bun.password, 'verify').mockRejectedValue(cause)
    try {
      const result = await verifyAdminPassword('correct-password', hash)
      expect(result).toEqual(unexpectedFailure(cause))
    } finally {
      verifier.mockRestore()
    }
  })
  test('backfill converts failed transactions into a result preserving the cause', async () => {
    const cause = new Error('Database unavailable')
    const db = { transaction: mock(() => Promise.reject(cause)) } as unknown as Database
    expect(await backfillWebsiteSearch(db)).toEqual(unexpectedFailure(cause))
  })
  test('CLI preserves operation errors, closes connections, and reports cleanup failures', async () => {
    const configured = configModule.readConfig(env as typeof Bun.env)
    const configSpy = spyOn(configModule, 'readConfig').mockReturnValue(configured)
    const close = mock(async (): Promise<ServiceResult<void>> => success(undefined))
    const db = {} as Database
    const connectSpy = spyOn(databaseModule, 'connectDb').mockResolvedValue(success({ db, close }))
    const cleanupError = unexpectedFailure(new Error('Close failed'))
    try {
      const businessError = serviceFailure('VALIDATION_ERROR', 'Cannot proceed', 400)
      expect(await runWithDatabase(async () => businessError)).toEqual(businessError)
      expect(close).toHaveBeenCalledTimes(1)
      close.mockResolvedValueOnce(cleanupError)
      expect(await runWithDatabase(async () => success('done'))).toEqual(cleanupError)
      const cause = new Error('Library rejected')
      expect(
        await runWithDatabase(async () => {
          throw cause
        }),
      ).toEqual(unexpectedFailure(cause))
      expect(close).toHaveBeenCalledTimes(3)
    } finally {
      configSpy.mockRestore()
      connectSpy.mockRestore()
    }
  })
  test('startup returns connection failures before constructing NestJS modules', async () => {
    const config = httpData(configModule.readConfig(env as typeof Bun.env))
    const failure = unexpectedFailure(new Error('Connection refused'))
    const connect = spyOn(databaseModule, 'connectDb').mockResolvedValue(failure)
    try {
      expect(await createApp(config, { logger: false })).toEqual(failure)
    } finally {
      connect.mockRestore()
    }
  })
})
