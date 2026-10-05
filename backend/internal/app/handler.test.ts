import { afterEach, beforeAll, describe, expect, mock, spyOn, test } from 'bun:test'
import type { Database, Connection } from '../database/client'
import { createApp } from './app'
import { unwrap } from '../testutil/helpers'
import { success } from '../../../shared/result'
import { serviceFailure } from '../result/result'
import { CredentialsService } from '../auth/service'
import { WebsitesService } from '../website/service'
import { TagsService } from '../tag/service'
import { createSession } from '../auth/session'
import { sign } from 'hono/jwt'
import type { AppConfig } from '../config/config'
import { createWebsiteSchema, updateWebsiteSchema } from '../website/schema'
import { tagSchema } from '../tag/schema'
import { changePasswordSchema } from '../auth/schema'
import { listQuerySchema } from '../website/query'

const origin = 'http://localhost:8111'
const config: AppConfig = {
  databaseUrl: 'postgresql://unused:5432/test',
  sessionSecret: 'test-secret-with-at-least-thirty-two-characters',
  appOrigin: origin,
  appOrigins: ['http://10.30.0.15:8111'],
  cookieSecure: true,
  port: 3000,
}
let passwordHash: string
beforeAll(async () => {
  passwordHash = await Bun.password.hash('correct-horse-battery', { algorithm: 'argon2id' })
})
afterEach(() => {
  mock.restore()
})

async function fixture() {
  const credential = { password_hash: passwordHash, version: 'v1' }
  spyOn(CredentialsService.prototype, 'current').mockResolvedValue(success(credential))
  const close = mock(async () => {})
  const db = {
    db: { execute: mock(async () => [[1]]) } as unknown as Database,
    close,
  } satisfies Connection
  const application = unwrap(await createApp(config, { database: db }))
  const session = await createSession(config.sessionSecret, credential.version)
  const headers = {
    cookie: `admin_session=${session.token}`,
    origin,
    'x-csrf-token': session.csrf,
    'content-type': 'application/json',
  }
  return { ...application, headers, session, databaseClose: close }
}

describe('Zod schemas', () => {
  test('normalizes inputs and rejects unknown, null and invalid fields', () => {
    expect(createWebsiteSchema.safeParse({ name: ' Site ', url: 'HTTPS://EXAMPLE.COM' })).toEqual({
      success: true,
      data: { name: 'Site', url: 'https://example.com/' },
    })
    for (const input of [
      { name: 'Site' },
      { name: null, url: 'https://example.com' },
      { name: 'Site', url: 'https://example.com', extra: true },
      { name: 'Site', url: 'javascript:alert(1)' },
      { name: 'Site', url: 'https://example.com', tag_ids: null },
    ])
      expect(createWebsiteSchema.safeParse(input).success).toBe(false)
    expect(updateWebsiteSchema.safeParse({}).success).toBe(false)
    expect(updateWebsiteSchema.safeParse({ name: null }).success).toBe(false)
    expect(updateWebsiteSchema.safeParse({ tag_ids: [] }).success).toBe(true)
    const id = crypto.randomUUID()
    expect(
      createWebsiteSchema.safeParse({ name: 'Site', url: 'https://example.com', tag_ids: [id, id] })
        .success,
    ).toBe(false)
    expect(tagSchema.safeParse({ name: ' ##Team ', color: '#AABBCC' })).toEqual({
      success: true,
      data: { name: 'Team', description: '', color: '#aabbcc' },
    })
    expect(
      changePasswordSchema.safeParse({
        currentPassword: 'same-long-password',
        newPassword: 'same-long-password',
      }).success,
    ).toBe(false)
  })

  test('query defaults, integer bounds, and duplicate filters', () => {
    expect(listQuerySchema.safeParse({})).toEqual({
      success: true,
      data: { page: 1, pageSize: 12, search: '', tagIds: [] },
    })
    for (const input of [
      { page: '0' },
      { page: '1.2' },
      { pageSize: '49' },
      { page: ['1', '2'] },
      { unknown: '' },
      { tagIds: 'bad' },
      { search: 'x'.repeat(161) },
    ])
      expect(listQuerySchema.safeParse(input).success).toBe(false)
  })
})

describe('Hono HTTP routes', () => {
  test('login sets a compatible secure session cookie and session endpoint reads it', async () => {
    const { app } = await fixture()
    const response = await app.request('/api/auth/login', {
      method: 'POST',
      headers: { origin, 'content-type': 'application/json' },
      body: JSON.stringify({ password: 'correct-horse-battery' }),
    })
    expect(response.status).toBe(200)
    const cookie = response.headers.get('set-cookie')!
    for (const option of ['HttpOnly', 'SameSite=Strict', 'Path=/api', 'Max-Age=28800', 'Secure'])
      expect(cookie).toContain(option)
    const body = await response.json()
    const session = await app.request('/api/auth/session', {
      headers: { cookie: cookie.split(';')[0]! },
    })
    expect(session.status).toBe(200)
    expect(await session.json()).toEqual(body)
  })

  test('invalid password, disallowed origin, and rate limiting retain status codes', async () => {
    const { app } = await fixture()
    const login = (from: string, password: string) =>
      app.request('/api/auth/login', {
        method: 'POST',
        headers: { origin: from, 'content-type': 'application/json' },
        body: JSON.stringify({ password }),
      })
    expect((await login('http://untrusted.example', 'correct-horse-battery')).status).toBe(403)
    expect((await login('http://10.30.0.15:8111', 'correct-horse-battery')).status).toBe(200)
    for (let attempt = 0; attempt < 5; attempt++)
      expect((await login(origin, 'wrong-password')).status).toBe(401)
    const limited = await login(origin, 'wrong-password')
    expect(limited.status).toBe(429)
    expect((await limited.json()).error.code).toBe('RATE_LIMITED')
  })

  test('protects website/tag reads and writes with session version, origin and CSRF', async () => {
    const { app, headers, session } = await fixture()
    const create = spyOn(WebsitesService.prototype, 'create')
    expect((await app.request('/api/websites')).status).toBe(401)
    expect((await app.request('/api/tags')).status).toBe(401)
    const revoked = await createSession(config.sessionSecret, 'v0')
    expect(
      (
        await app.request('/api/auth/session', {
          headers: { cookie: `admin_session=${revoked.token}` },
        })
      ).status,
    ).toBe(401)
    for (const altered of [
      { ...headers, 'x-csrf-token': 'wrong' },
      { ...headers, origin: 'http://untrusted.example' },
    ]) {
      expect(
        (
          await app.request('/api/websites', {
            method: 'POST',
            headers: altered,
            body: JSON.stringify({ name: 'Site', url: 'https://example.com' }),
          })
        ).status,
      ).toBe(403)
    }
    expect(create).not.toHaveBeenCalled()
    const logout = await app.request('/api/auth/logout', { method: 'POST', headers })
    expect(logout.status).toBe(200)
    expect(logout.headers.get('set-cookie')).toContain('Max-Age=0')
    expect(logout.headers.get('set-cookie')).toContain('Secure')
    expect(session.csrf).toBeTruthy()
  })

  test('normalizes successful writes and maps service failures directly to JSON', async () => {
    const { app, headers } = await fixture()
    const create = spyOn(WebsitesService.prototype, 'create').mockImplementation(async (input) =>
      success({ id: '1', ...input, tag_ids: [], tags: [], created_at: 'now', updated_at: 'now' }),
    )
    const created = await app.request('/api/websites', {
      method: 'POST',
      headers,
      body: JSON.stringify({ name: ' Site ', url: 'HTTPS://EXAMPLE.COM' }),
    })
    expect(created.status).toBe(201)
    expect(create).toHaveBeenCalledWith({ name: 'Site', url: 'https://example.com/' })
    expect((await created.json()).website.url).toBe('https://example.com/')
    spyOn(TagsService.prototype, 'create').mockResolvedValue(
      serviceFailure('CONFLICT', 'A tag with this name already exists', 409),
    )
    const duplicate = await app.request('/api/tags', {
      method: 'POST',
      headers,
      body: JSON.stringify({ name: 'Team', color: '#166534' }),
    })
    expect(duplicate.status).toBe(409)
    expect(await duplicate.json()).toEqual({
      error: { code: 'CONFLICT', message: 'A tag with this name already exists' },
    })
  })

  test('validation rejects malformed JSON, wrong media type, oversized body and invalid queries', async () => {
    const { app, headers } = await fixture()
    const create = spyOn(WebsitesService.prototype, 'create')
    for (const body of [
      '{',
      'null',
      '{}',
      '{"name":"Site","url":"https://example.com","extra":true}',
    ]) {
      const response = await app.request('/api/websites', { method: 'POST', headers, body })
      expect(response.status).toBe(400)
      expect((await response.json()).error.code).toBe('VALIDATION_ERROR')
    }
    expect(
      (
        await app.request('/api/websites', {
          method: 'POST',
          headers: { ...headers, 'content-type': 'text/plain' },
          body: '{}',
        })
      ).status,
    ).toBe(400)
    expect(
      (
        await app.request('/api/websites', {
          method: 'POST',
          headers,
          body: 'x'.repeat(1024 * 1024 + 1),
        })
      ).status,
    ).toBe(413)
    expect(create).not.toHaveBeenCalled()
    for (const query of ['page=1&page=2', 'unknown=1', 'pageSize=0', 'tagIds=invalid']) {
      const response = await app.request(`/api/websites?${query}`, { headers })
      expect(response.status).toBe(400)
    }
  })

  test('CORS preflight works before auth and only allows configured origins', async () => {
    const { app } = await fixture()
    const preflight = await app.request('/api/websites', {
      method: 'OPTIONS',
      headers: {
        origin,
        'access-control-request-method': 'PATCH',
        'access-control-request-headers': 'Content-Type,X-CSRF-Token',
      },
    })
    expect(preflight.status).toBe(204)
    expect(preflight.headers.get('access-control-allow-origin')).toBe(origin)
    expect(preflight.headers.get('access-control-allow-credentials')).toBe('true')
    const blocked = await app.request('/api/websites', {
      method: 'OPTIONS',
      headers: { origin: 'http://untrusted.example', 'access-control-request-method': 'POST' },
    })
    expect(blocked.headers.get('access-control-allow-origin')).toBeNull()
  })

  test('password change rotates the session and handles concurrent changes', async () => {
    const { app, headers } = await fixture()
    const replace = spyOn(CredentialsService.prototype, 'replace').mockResolvedValue(
      success({ password_hash: 'new-hash', version: 'v2' }),
    )
    const change = (currentPassword: string, newPassword = 'new-correct-horse-battery') =>
      app.request('/api/auth/change-password', {
        method: 'POST',
        headers,
        body: JSON.stringify({ currentPassword, newPassword }),
      })
    expect((await change('wrong-password')).status).toBe(401)
    expect((await change('correct-horse-battery', 'short')).status).toBe(400)
    expect((await change('correct-horse-battery', 'correct-horse-battery')).status).toBe(400)
    const changed = await change('correct-horse-battery')
    expect(changed.status).toBe(200)
    expect(changed.headers.get('set-cookie')).toContain('admin_session=')
    expect(replace).toHaveBeenCalledWith('new-correct-horse-battery', 'v1')
    replace.mockResolvedValue(success(null))
    expect((await change('correct-horse-battery')).status).toBe(409)
  })

  test('health, unknown routes and external database ownership are preserved', async () => {
    const { app, close, databaseClose } = await fixture()
    expect((await app.request('/health')).status).toBe(200)
    const response = await app.request('/missing')
    expect(response.status).toBe(404)
    expect((await response.json()).error.code).toBe('NOT_FOUND')
    expect((await close()).code).toBe(0)
    expect(databaseClose).not.toHaveBeenCalled()
  })
})

test('standard query validation passes normalized values and defaults to the service', async () => {
  const { app, headers } = await fixture()
  const list = spyOn(WebsitesService.prototype, 'list').mockResolvedValue(
    success({ websites: [], total: 0, page: 1, pageSize: 12 }),
  )
  expect((await app.request('/api/websites', { headers })).status).toBe(200)
  expect(list).toHaveBeenLastCalledWith({ page: 1, pageSize: 12, search: '', tagIds: [] })
  const first = crypto.randomUUID()
  const second = crypto.randomUUID()
  const response = await app.request(
    `/api/websites?page=2&pageSize=24&search=%20Team%20&tagIds=${first},${second}`,
    { headers },
  )
  expect(response.status).toBe(200)
  expect(list).toHaveBeenLastCalledWith({
    page: 2,
    pageSize: 24,
    search: 'Team',
    tagIds: [first, second],
  })
})

test('standard JSON validation normalizes tags using Hono JSON parsing', async () => {
  const { app, headers } = await fixture()
  const create = spyOn(TagsService.prototype, 'create').mockImplementation(async (input) =>
    success({ id: '1', ...input, created_at: 'now', updated_at: 'now' }),
  )
  for (const contentType of [
    'application/json',
    'Application/JSON; charset=utf-8',
    'application/problem+json',
    'application/vnd.api+json',
  ]) {
    const response = await app.request('/api/tags', {
      method: 'POST',
      headers: { ...headers, 'content-type': contentType },
      body: JSON.stringify({ name: ' ##Team ', color: '#AABBCC' }),
    })
    expect(response.status).toBe(201)
    expect(create).toHaveBeenLastCalledWith({ name: 'Team', description: '', color: '#aabbcc' })
  }
})

test('standard validator errors preserve the API shape and do not echo passwords', async () => {
  const { app } = await fixture()
  const password = 'private-submitted-password'
  const response = await app.request('/api/auth/login', {
    method: 'POST',
    headers: { origin, 'content-type': 'application/json' },
    body: JSON.stringify({ password, extra: 'private-extra' }),
  })
  expect(response.status).toBe(400)
  const body = await response.json()
  expect(Object.keys(body)).toEqual(['error'])
  expect(body.error.code).toBe('VALIDATION_ERROR')
  expect(JSON.stringify(body)).not.toContain(password)
  expect(JSON.stringify(body)).not.toContain('private-extra')
})

test('authentication and CSRF run before JSON validation on protected writes', async () => {
  const { app, headers } = await fixture()
  for (const path of ['/api/websites', '/api/tags', '/api/auth/change-password']) {
    const unauthorized = await app.request(path, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: '{',
    })
    expect(unauthorized.status).toBe(401)
    const forbidden = await app.request(path, {
      method: 'POST',
      headers: { ...headers, 'x-csrf-token': 'wrong' },
      body: '{',
    })
    expect(forbidden.status).toBe(403)
  }
})

test('native JWT middleware rejects expired, tampered and invalid session claims', async () => {
  const { app } = await fixture()
  const valid = await createSession(config.sessionSecret, 'v1')
  const expired = await sign(
    { sub: 'admin', exp: Math.floor(Date.now() / 1000) - 60, csrf: 'token', version: 'v1' },
    config.sessionSecret,
    'HS256',
  )
  const missingExpiry = await sign(
    { sub: 'admin', csrf: 'token', version: 'v1' },
    config.sessionSecret,
    'HS256',
  )
  const invalidClaims = await sign(
    { sub: 'admin', exp: Math.floor(Date.now() / 1000) + 60, csrf: 123, version: 'v1' },
    config.sessionSecret,
    'HS256',
  )
  const parts = valid.token.split('.')
  const tampered = `${parts[0]}.${parts[1]}.invalid-signature`
  for (const token of [
    expired,
    missingExpiry,
    invalidClaims,
    tampered,
    'old-payload.old-signature',
  ]) {
    const response = await app.request('/api/auth/session', {
      headers: { cookie: `admin_session=${token}` },
    })
    expect(response.status).toBe(401)
    expect((await response.json()).error.code).toBe('UNAUTHORIZED')
  }
  const validResponse = await app.request('/api/auth/session', {
    headers: { cookie: `admin_session=${valid.token}` },
  })
  expect(validResponse.status).toBe(200)
  expect((await validResponse.json()).csrfToken).toBe(valid.csrf)
})

test('Hono CSRF rejects cross-site form requests and JSON header policy cannot be bypassed', async () => {
  const { app, headers } = await fixture()
  const form = await app.request('/api/auth/login', {
    method: 'POST',
    headers: {
      origin: 'http://untrusted.example',
      'content-type': 'application/x-www-form-urlencoded',
      'sec-fetch-site': 'cross-site',
    },
    body: 'password=test',
  })
  expect(form.status).toBe(403)
  expect((await form.json()).error.code).toBe('FORBIDDEN')
  const spoofed = await app.request('/api/websites', {
    method: 'POST',
    headers: { ...headers, origin: 'http://untrusted.example', 'sec-fetch-site': 'same-origin' },
    body: JSON.stringify({ name: 'Site', url: 'https://example.com' }),
  })
  expect(spoofed.status).toBe(403)
  const missingOrigin = { ...headers }
  delete (missingOrigin as Partial<typeof headers>).origin
  expect(
    (await app.request('/api/websites', { method: 'POST', headers: missingOrigin, body: '{}' }))
      .status,
  ).toBe(403)
})

test('documented rate limiter resets failed attempts after a successful login', async () => {
  const { app } = await fixture()
  const login = (password: string) =>
    app.request('/api/auth/login', {
      method: 'POST',
      headers: { origin, 'content-type': 'application/json' },
      body: JSON.stringify({ password }),
    })
  for (let i = 0; i < 2; i++) expect((await login('wrong-password')).status).toBe(401)
  expect((await login('correct-horse-battery')).status).toBe(200)
  for (let i = 0; i < 3; i++) expect((await login('wrong-password')).status).toBe(401)
  expect((await login('correct-horse-battery')).status).toBe(200)
})

test('native ConnInfo isolates login quotas by the Bun connection address', async () => {
  const { app } = await fixture()
  const login = (address: string, password: string) =>
    app.request(
      '/api/auth/login',
      {
        method: 'POST',
        headers: { origin, 'content-type': 'application/json' },
        body: JSON.stringify({ password }),
      },
      { server: { requestIP: () => ({ address, family: 'IPv4', port: 12345 }) } },
    )
  for (let i = 0; i < 5; i++) expect((await login('127.0.0.1', 'wrong-password')).status).toBe(401)
  const blocked = await login('127.0.0.1', 'wrong-password')
  expect(blocked.status).toBe(429)
  expect(blocked.headers.get('retry-after')).not.toBeNull()
  expect((await login('127.0.0.2', 'correct-horse-battery')).status).toBe(200)
})
