import { createApp } from '../src/app.factory'
import { httpData } from '../src/common/errors/result'
import { describe, expect, mock, spyOn, test } from 'bun:test'
import { Surreal } from 'surrealdb'
import type { SiteOrm } from '../src/database/database.module'
import type { AppConfig } from '../src/config/app-config'
import { attempt, attemptSync } from '../../shared/result'
import { TagsService } from '../src/tags/tags.service'
import { WebsitesService } from '../src/websites/websites.service'
import { CredentialsService } from '../src/auth/credentials.service'
import { createHmac } from 'node:crypto'
import { createSession, readSession } from '../src/auth/session'
import { connectDb } from '../src/database/surreal.client'

const input = { name: 'Team', description: '', color: '#166534' }
const website = { name: 'Site', url: 'https://example.com' }
const database = (query: unknown) => ({ query }) as Surreal
const orm = (value: unknown) => value as SiteOrm

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

describe('backend service return codes', () => {
  test('tag create returns conflicts and unexpected database failures', async () => {
    const duplicate = new Error('unique index already contains value')
    const conflict = new TagsService(
      database(null),
      orm({ create: () => ({ content: () => Promise.reject(duplicate) }) }),
    )
    const result = await conflict.create(input)
    expect(result.code).toBe(1)
    if (result.code !== 0)
      expect(result.error).toEqual({
        code: 'CONFLICT',
        message: 'A tag with this name already exists',
        status: 409,
      })
    const cause = new Error('Database disconnected')
    const broken = new TagsService(
      database(null),
      orm({
        create: () => ({
          content: () => {
            throw cause
          },
        }),
      }),
    )
    const failure = await broken.create(input)
    expect(failure.code).toBe(1)
    if (failure.code !== 0) {
      expect(failure.error.code).toBe('INTERNAL_ERROR')
      expect(failure.error.cause).toBe(cause)
    }
  })

  test('tag update and delete return NOT_FOUND without throwing', async () => {
    const service = new TagsService(
      database(async () => [[]]),
      orm({ update: () => ({ where: () => ({ set: () => ({ return: async () => [] }) }) }) }),
    )
    for (const result of [
      await service.update('missing', input),
      await service.delete('missing'),
    ]) {
      expect(result.code).toBe(1)
      if (result.code !== 0) expect(result.error.status).toBe(404)
    }
  })

  test('invalid tag IDs stop website creation before querying', async () => {
    const query = mock(async () => [[]])
    const service = new WebsitesService(database(query), orm({}))
    const result = await service.create({ ...website, tag_ids: ['invalid'] })
    expect(query).not.toHaveBeenCalled()
    expect(result.code).toBe(1)
    if (result.code !== 0) expect(result.error.code).toBe('VALIDATION_ERROR')
  })

  test('tags deleted during a transaction return validation errors', async () => {
    const id = crypto.randomUUID()
    const query = mock(async (sql: string) => {
      if (sql.startsWith('SELECT')) return [[{ tag_id: id }]]
      throw new Error('INVALID_TAG_IDS')
    })
    const service = new WebsitesService(database(query), orm({}))
    const result = await service.create({ ...website, tag_ids: [id] })
    expect(result.code).toBe(1)
    if (result.code !== 0) expect(result.error.status).toBe(400)
    expect(query).toHaveBeenCalledTimes(2)
  })

  test('website transaction failures preserve their cause', async () => {
    const cause = new Error('Transaction aborted')
    const query = mock(async (sql: string) => {
      if (sql.startsWith('SELECT')) return [[]]
      throw cause
    })
    const service = new WebsitesService(database(query), orm({}))
    const result = await service.create(website)
    expect(result.code).toBe(1)
    if (result.code !== 0) expect(result.error.cause).toBe(cause)
    expect(query).toHaveBeenCalledTimes(3)
  })

  test('concurrent credential initialization reads the winning record', async () => {
    const credential = { password_hash: 'winning-hash', version: 'winning-version' }
    let reads = 0
    const service = new CredentialsService(
      orm({
        select: async () => (++reads === 1 ? [] : [credential]),
        create: () => ({
          content: async () => {
            throw new Error('already exists')
          },
        }),
      }),
      { adminPasswordHash: 'initial-hash' } as AppConfig,
    )
    expect(await service.current()).toEqual({ code: 0, data: credential })
  })

  test('database validation returns an error before connecting', async () => {
    const result = await connectDb({
      surrealUrl: 'ws://unused:8000',
      surrealUser: 'root',
      surrealPass: '',
      surrealNamespace: 'invalid-name',
      surrealDatabase: 'test',
    })
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
  expect(readSession(createSession(secret, 'v1').token, secret)?.version).toBe('v1')
})

test('NestJS HTTP boundary preserves health and authentication errors', async () => {
  const config: AppConfig = {
    surrealUrl: 'ws://unused:8000',
    surrealUser: 'root',
    surrealPass: '',
    surrealNamespace: 'tests',
    surrealDatabase: 'tests',
    sessionSecret: 'test-secret-with-at-least-thirty-two-characters',
    appOrigin: 'http://localhost:8111',
    cookieSecure: false,
    port: 3000,
  }
  const db = database(async () => {
    throw new Error('Database disconnected')
  })
  const created = await createApp(config, { database: db, logger: false })
  expect(created.code).toBe(0)
  const app = httpData(created)
  const health = await app.inject({ url: '/health' })
  const unauthorized = await app.inject({ url: '/api/websites' })
  await app.close()
  expect(health.statusCode).toBe(503)
  expect(health.json<{ error: { code: string; message: string } }>()).toEqual({
    error: { code: 'DATABASE_UNAVAILABLE', message: 'Unable to connect to the database' },
  })
  expect(unauthorized.statusCode).toBe(401)
  expect(unauthorized.json().error.code).toBe('UNAUTHORIZED')
})

test('failed database setup closes the connection and preserves the original error', async () => {
  const cause = new Error('Authentication failed')
  const connect = spyOn(Surreal.prototype, 'connect').mockRejectedValue(cause)
  const close = spyOn(Surreal.prototype, 'close').mockResolvedValue(true)
  const result = await connectDb({
    surrealUrl: 'ws://unused:8000',
    surrealUser: 'root',
    surrealPass: '',
    surrealNamespace: 'tests',
    surrealDatabase: 'tests',
  })
  const closeCalls = close.mock.calls.length
  connect.mockRestore()
  close.mockRestore()
  expect(closeCalls).toBe(1)
  expect(result.code).toBe(1)
  if (result.code !== 0) expect(result.error.cause).toBe(cause)
})
