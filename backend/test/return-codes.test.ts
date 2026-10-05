import { WebsitesRepository } from '../src/modules/websites/websites.repository'
import { describe, expect, mock, test } from 'bun:test'
import { createHmac } from 'node:crypto'
import { createApp } from '../src/app.factory'
import type { Repository } from 'typeorm'
import type { WebsiteEntity } from '../src/modules/websites/entities/website.entity'
import type { Database } from '../src/database/client'
import { query } from '../src/database/error'
import { httpData } from '../src/common/errors/result'
import type { AppConfig } from '../src/config/app.config'
import { readConfig } from '../src/config/app.config'
import { attempt, attemptSync } from '../../shared/result'
import { WebsitesService } from '../src/modules/websites/websites.service'
import { createSession, readSession } from '../src/modules/auth/session'

describe('exception adapters', () => {
  test('captures synchronous throws, rejections, and falsy errors', async () => {
    expect(
      await attempt(() => {
        throw null
      }),
    ).toEqual({ code: 1, error: null })
    expect(await attempt(() => Promise.reject(undefined))).toEqual({ code: 1, error: undefined })
    expect(attemptSync(() => JSON.parse('{')).code).toBe(1)
    expect(await attempt(() => 0)).toEqual({ code: 0, data: 0 })
  })
})
describe('PostgreSQL return codes', () => {
  test('maps nested unique and foreign key violations to API errors', async () => {
    for (const [cause, expected] of [
      [{ code: '23505', constraint_name: 'tags_name_key_unique' }, 'CONFLICT'],
      [{ code: '23503' }, 'VALIDATION_ERROR'],
    ] as const) {
      const result = await query(() => Promise.reject(new Error('query failed', { cause })))
      expect(result.code).toBe(1)
      if (result.code !== 0) expect(result.error.code).toBe(expected)
    }
  })
  test('preserves unexpected database failures', async () => {
    const cause = new Error('Connection lost')
    const result = await query(() => Promise.reject(cause))
    expect(result.code).toBe(1)
    if (result.code !== 0) expect(result.error.cause).toBe(cause)
  })
  test('invalid and duplicate tag IDs stop website writes before querying', async () => {
    const transaction = mock(() => {
      throw new Error('must not query')
    })
    const service = new WebsitesService(
      new WebsitesRepository({
        manager: { transaction },
      } as unknown as Repository<WebsiteEntity>),
    )
    const id = crypto.randomUUID()
    for (const tag_ids of [['invalid'], [id, id]]) {
      const result = await service.create({ name: 'Site', url: 'https://example.com', tag_ids })
      expect(result.code).toBe(1)
      if (result.code !== 0) expect(result.error.code).toBe('VALIDATION_ERROR')
    }
    expect(transaction).not.toHaveBeenCalled()
  })
  test('configuration rejects non-PostgreSQL connections', () => {
    const result = readConfig({ DATABASE_URL: 'https://example.com' } as typeof Bun.env)
    expect(result.code).toBe(1)
    if (result.code !== 0) expect(result.error.code).toBe('CONFIGURATION_ERROR')
  })
})
test('session parser handles signed malformed payloads without throwing', () => {
  const secret = 'test-secret'
  for (const content of ['{', 'null', '[]', '"text"', '{"exp":0}']) {
    const payload = Buffer.from(content).toString('base64url')
    const signature = createHmac('sha256', secret).update(payload).digest('base64url')
    expect(readSession(`${payload}.${signature}`, secret)).toBeNull()
  }
  expect(readSession(httpData(createSession(secret, 'v1')).token, secret)?.version).toBe('v1')
})
test('NestJS HTTP boundary preserves health and authentication errors', async () => {
  const config: AppConfig = {
    databaseUrl: 'postgresql://unused/test',
    sessionSecret: 'test-secret-with-at-least-thirty-two-characters',
    appOrigin: 'http://localhost:8111',
    cookieSecure: false,
    port: 3000,
  }
  const db = {
    entityMetadatas: [],
    options: { type: 'postgres' },
    getRepository: () => ({}),
    query: async () => {
      throw new Error('Database disconnected')
    },
  } as unknown as Database
  const app = httpData(await createApp(config, { database: db, logger: false }))
  try {
    const health = await app.inject({ url: '/health' })
    const unauthorized = await app.inject({ url: '/api/websites' })
    expect(health.statusCode).toBe(503)
    expect(health.json<{ error: { code: string; message: string } }>()).toEqual({
      error: { code: 'DATABASE_UNAVAILABLE', message: 'Unable to connect to the database' },
    })
    expect(unauthorized.statusCode).toBe(401)
    expect(unauthorized.json().error.code).toBe('UNAUTHORIZED')
  } finally {
    await app.close()
  }
})
