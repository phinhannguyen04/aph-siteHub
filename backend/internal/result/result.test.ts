import { describe, expect, mock, test } from 'bun:test'
import { attempt, attemptSync, success } from '../../../shared/result'
import { query } from '../database/error'
import { serviceFailure } from './result'
import { WebsitesService } from '../website/service'
import type { Repository as WebsiteRepository } from '../website/repository'
import { CredentialsService } from '../auth/service'
import type { Repository as CredentialRepository } from '../auth/repository'
import { createApp } from '../app/app'
import type { Connection, Database } from '../database/client'
import { unwrap } from '../testutil/helpers'

const input = { name: 'Site', url: 'https://example.com' }

describe('exception adapters', () => {
  test('captures synchronous throws, rejections and falsy errors', async () => {
    expect(
      await attempt(() => {
        throw null
      }),
    ).toEqual({ code: 1, error: null })
    expect(await attempt(() => Promise.reject(undefined))).toEqual({ code: 1, error: undefined })
    expect(attemptSync(() => JSON.parse('{')).code).toBe(1)
    expect(await attempt(() => 0)).toEqual({ code: 0, data: 0 })
  })
  test('maps PostgreSQL error codes through Drizzle cause chains', async () => {
    const result = await query(() =>
      Promise.reject(
        new Error('Query failed', {
          cause: { code: '23505', constraint_name: 'tags_name_key_unique' },
        }),
      ),
    )
    expect(result.code).toBe(1)
    if (result.code !== 0) expect(result.error.status).toBe(409)
    const foreignKey = await query(() => Promise.reject({ code: '23503' }))
    expect(foreignKey.code).toBe(1)
    if (foreignKey.code !== 0) expect(foreignKey.error.code).toBe('VALIDATION_ERROR')
    const cause = new Error('Connection lost')
    const unexpected = await query(() => Promise.reject(cause))
    expect(unexpected.code).toBe(1)
    if (unexpected.code !== 0) expect(unexpected.error.cause).toBe(cause)
  })
})

test('website service rejects invalid tag IDs before calling its repository', async () => {
  const create = mock(async () => serviceFailure('INTERNAL_ERROR', 'Unexpected call', 500))
  const repository = { create } as unknown as WebsiteRepository
  const result = await new WebsitesService(repository).create({ ...input, tag_ids: ['invalid'] })
  expect(create).not.toHaveBeenCalled()
  expect(result.code).toBe(1)
  if (result.code !== 0) expect(result.error.code).toBe('VALIDATION_ERROR')
})

test('credential service returns the winning initialization and preserves repository errors', async () => {
  const credential = { password_hash: 'winning-hash', version: 'winning-version' }
  const repository = {
    find: async () => success(null),
    initialize: async () => success(credential),
  } as unknown as CredentialRepository
  expect(
    await new CredentialsService(repository, { adminPasswordHash: 'initial-hash' }).current(),
  ).toEqual({ code: 0, data: credential })
  const failed = serviceFailure('INTERNAL_ERROR', 'Internal server error', 500)
  repository.find = async () => failed
  expect(await new CredentialsService(repository, {}).current()).toEqual(failed)
})

test('Hono preserves health failure and external connection ownership', async () => {
  const close = mock(async () => {})
  const db = {
    execute: async () => {
      throw new Error('Database disconnected')
    },
  } as unknown as Database
  const database: Connection = { db, close }
  const application = unwrap(
    await createApp(
      {
        databaseUrl: 'postgresql://unused/test',
        sessionSecret: 'test-secret-with-at-least-thirty-two-characters',
        appOrigin: 'http://localhost:8111',
        cookieSecure: false,
        port: 3000,
      },
      { database },
    ),
  )
  const health = await application.app.request('/health')
  expect(health.status).toBe(503)
  expect(await health.json()).toEqual({
    error: { code: 'DATABASE_UNAVAILABLE', message: 'Unable to connect to the database' },
  })
  expect((await application.app.request('/api/websites')).status).toBe(401)
  expect((await application.close()).code).toBe(0)
  expect(close).not.toHaveBeenCalled()
})
