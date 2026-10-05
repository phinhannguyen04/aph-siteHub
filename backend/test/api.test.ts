import { httpData } from '../src/common/errors/result'
import { afterAll, beforeAll, describe, expect, test } from 'bun:test'
import type { NestFastifyApplication } from '@nestjs/platform-fastify'
import type { Surreal } from 'surrealdb'
import { createApp } from '../src/app.factory'
import { readConfig, type AppConfig } from '../src/config/app-config'
import { connectDb } from '../src/database/surreal.client'
import { normalizeUrl } from '../src/websites/website-normalization'
import { ValidationError } from '../src/common/errors/validation-error'
import { resetAdminPassword } from '../src/auth/password-reset'

const origin = 'http://localhost:8111'
const testUrl = Bun.env.SURREAL_TEST_URL
let db: Surreal
let app: NestFastifyApplication
let cookie = ''
let csrf = ''

async function call(
  path: string,
  method = 'GET',
  body?: unknown,
  authenticated = true,
  token = csrf,
) {
  return app.inject({
    url: path,
    method: method as 'GET' | 'POST' | 'PATCH' | 'DELETE',
    headers: {
      origin,
      ...(authenticated ? { cookie, 'x-csrf-token': token } : {}),
      ...(body ? { 'content-type': 'application/json' } : {}),
    },
    payload: body ? JSON.stringify(body) : undefined,
  })
}

describe('URL validation', () => {
  test('normalizes valid HTTP URLs', () => {
    expect(normalizeUrl('  HTTPS://Example.COM/path  ')).toBe('https://example.com/path')
  })
  test('rejects scripts, credentials and invalid URLs', () => {
    for (const url of [
      'javascript:alert(1)',
      'ftp://example.com',
      'https://user:pass@example.com',
      'not a url',
    ]) {
      expect(() => normalizeUrl(url)).toThrow(ValidationError)
    }
  })
})

const integration = testUrl ? describe : describe.skip
integration('NestJS Fastify API with SurrealDB', () => {
  beforeAll(async () => {
    const config: AppConfig = {
      surrealUrl: testUrl!,
      surrealUser: Bun.env.SURREAL_USER || 'root',
      surrealPass: Bun.env.SURREAL_PASS || '',
      surrealNamespace: 'sitehub_tests',
      surrealDatabase: `test_${crypto.randomUUID().replaceAll('-', '')}`,
      adminPasswordHash: await Bun.password.hash('correct-horse-battery', {
        algorithm: 'argon2id',
      }),
      sessionSecret: 'test-secret-with-at-least-thirty-two-characters',
      appOrigin: origin,
      appOrigins: ['http://10.30.0.15:8111'],
      cookieSecure: false,
      port: 3000,
    }
    db = httpData(await connectDb(config))
    for (const name of ['001_websites.surql', '002_admin_credentials.surql', '003_tags.surql'])
      await db.query(await Bun.file(new URL(`../migrations/${name}`, import.meta.url)).text())
    app = httpData(await createApp(config, { database: db, logger: false }))
    const login = await call(
      '/api/auth/login',
      'POST',
      { password: 'correct-horse-battery' },
      false,
    )
    expect(login.statusCode).toBe(200)
    cookie = login.headers['set-cookie']!.toString().split(';')[0]!
    csrf = login.json().csrfToken
  })
  afterAll(async () => {
    if (app) await app.close()
    if (db) await db.close()
  })

  test('authentication and CSRF protect administration', async () => {
    expect((await call('/api/websites', 'GET', undefined, false)).statusCode).toBe(401)
    expect(
      (await call('/api/websites', 'POST', { name: 'A', url: 'https://a.com' }, true, 'wrong'))
        .statusCode,
    ).toBe(403)
  })

  test('allows the configured LAN origin and rejects an unknown origin', async () => {
    const login = (fromOrigin: string) =>
      app.inject({
        url: '/api/auth/login',
        method: 'POST',
        headers: { origin: fromOrigin, 'content-type': 'application/json' },
        payload: JSON.stringify({ password: 'correct-horse-battery' }),
      })
    expect((await login('http://10.30.0.15:8111')).statusCode).toBe(200)
    expect((await login('http://untrusted.example:8111')).statusCode).toBe(403)
  })

  test('create, list, count, update, validation and missing ID', async () => {
    const invalid = await call('/api/websites', 'POST', { name: ' ', url: 'https://a.com' })
    expect(invalid.statusCode).toBe(400)
    expect(invalid.json().error.code).toBe('VALIDATION_ERROR')
    for (const invalidBody of [
      { name: 'Missing URL' },
      { name: 'Unsafe URL', url: 'javascript:alert(1)' },
      { name: 'Unknown field', url: 'https://example.com', extra: true },
    ]) {
      const response = await call('/api/websites', 'POST', invalidBody)
      expect(response.statusCode).toBe(400)
      expect(response.json().error.code).toBe('VALIDATION_ERROR')
    }
    const created = await call('/api/websites', 'POST', {
      name: '  Example  ',
      url: 'HTTPS://EXAMPLE.COM',
    })
    expect(created.statusCode).toBe(201)
    const item = created.json().website
    expect(item.name).toBe('Example')
    expect(item.url).toBe('https://example.com/')
    expect((await call('/api/websites/count')).json().count).toBe(1)
    const updated = await call(`/api/websites/${item.id}`, 'PATCH', {
      name: 'Updated',
      url: 'https://new.example/path',
    })
    expect(updated.statusCode).toBe(200)
    expect(updated.json().website.url).toBe('https://new.example/path')
    expect((await call(`/api/websites/${item.id}`, 'PATCH', {})).statusCode).toBe(400)
    expect((await call(`/api/websites/${item.id}`, 'PATCH', { name: null })).statusCode).toBe(400)
    const partial = await call(`/api/websites/${item.id}`, 'PATCH', { name: '  Partial update  ' })
    expect(partial.statusCode).toBe(200)
    expect(partial.json().website.name).toBe('Partial update')
    expect(partial.json().website.url).toBe('https://new.example/path')
    const list = (await call('/api/websites')).json().websites
    expect(list).toHaveLength(1)
    expect(list[0].name).toBe('Partial update')
    expect((await call('/api/websites/missing', 'PATCH', { name: 'Nothing' })).statusCode).toBe(404)
    expect((await call('/api/websites/count')).json().count).toBe(1)
  })

  test('tags, filtering, pagination and deletion', async () => {
    expect((await call('/api/tags', 'GET', undefined, false)).statusCode).toBe(401)
    expect(
      (await call('/api/tags', 'POST', { name: 'A', color: '#166534' }, true, 'wrong')).statusCode,
    ).toBe(403)
    expect((await call('/api/tags', 'POST', { name: '  #  ', color: '#166534' })).statusCode).toBe(
      400,
    )
    expect((await call('/api/tags', 'POST', { name: 'Bad', color: 'red' })).statusCode).toBe(400)
    const first = await call('/api/tags', 'POST', {
      name: ' #Công việc ',
      description: 'Work',
      color: '#166534',
    })
    expect(first.statusCode).toBe(201)
    const tag = first.json().tag
    expect(tag.name).toBe('Công việc')
    expect(
      (await call('/api/tags', 'POST', { name: 'cÔng Việc', color: '#166534' })).statusCode,
    ).toBe(409)
    const second = await call('/api/tags', 'POST', { name: 'Team', color: '#225577' })
    expect(second.statusCode).toBe(201)
    const other = second.json().tag
    const created = await call('/api/websites', 'POST', {
      name: 'Đường dẫn',
      url: 'https://filter.example',
      tag_ids: [tag.id, other.id],
    })
    expect(created.statusCode).toBe(201)
    const id = created.json().website.id
    expect(
      (
        await call('/api/websites', 'POST', {
          name: 'Invalid',
          url: 'https://invalid.example',
          tag_ids: [crypto.randomUUID()],
        })
      ).statusCode,
    ).toBe(400)
    const list = await call(
      `/api/websites?page=1&pageSize=1&search=duong&tagIds=${tag.id},${other.id}`,
    )
    expect(list.statusCode).toBe(200)
    expect(list.json().total).toBe(1)
    expect(list.json().websites[0].id).toBe(id)
    expect((await call('/api/websites?page=0')).statusCode).toBe(400)
    expect((await call('/api/websites?pageSize=100')).statusCode).toBe(400)
    expect((await call('/api/websites?tagIds=bad')).statusCode).toBe(400)
    expect((await call(`/api/websites/${id}`, 'PATCH', { tag_ids: [other.id] })).statusCode).toBe(
      200,
    )
    expect((await call(`/api/websites?tagIds=${tag.id}`)).json().total).toBe(0)
    expect((await call(`/api/websites?tagIds=${other.id}`)).json().total).toBe(1)
    expect(
      (
        await call(`/api/tags/${other.id}`, 'PATCH', {
          name: 'Team new',
          description: 'Updated',
          color: '#111111',
        })
      ).statusCode,
    ).toBe(200)
    expect((await call(`/api/tags/${other.id}`, 'DELETE')).statusCode).toBe(200)
    expect((await call('/api/websites?search=duong')).json().websites[0].tag_ids).toEqual([])
  })

  test('concurrent duplicate names and stable page boundaries', async () => {
    const input = { name: 'Concurrent', description: '', color: '#166534' }
    const results = await Promise.all([
      call('/api/tags', 'POST', input),
      call('/api/tags', 'POST', input),
    ])
    expect(results.map((result) => result.statusCode).sort()).toEqual([201, 409])
    const names = ['Stable one', 'Stable two', 'Stable three']
    const ids: string[] = []
    for (const name of names) {
      const created = await call('/api/websites', 'POST', { name, url: 'https://stable.example' })
      expect(created.statusCode).toBe(201)
      ids.push(created.json().website.id)
    }
    await db.query('UPDATE websites SET created_at = $when WHERE website_id IN $ids', {
      when: '2026-01-01T00:00:00.000Z',
      ids,
    })
    const pages = []
    for (let page = 1; page <= 3; page++) {
      const result = await call(`/api/websites?search=stable&page=${page}&pageSize=1`)
      expect(result.statusCode).toBe(200)
      expect(result.json().total).toBe(3)
      pages.push(result.json().websites[0].id)
    }
    expect(pages).toEqual([...ids].sort().reverse())
    expect((await call('/api/websites?search=stable&page=4&pageSize=1')).json().websites).toEqual(
      [],
    )
    expect((await call('/api/websites?pageSize=no')).statusCode).toBe(400)
  })

  test('password change verifies current password and revokes older sessions', async () => {
    const invalidPassword = await call('/api/auth/change-password', 'POST', {
      currentPassword: 'correct-horse-battery',
      newPassword: 'short',
    })
    expect(invalidPassword.statusCode).toBe(400)
    expect(invalidPassword.json().error.code).toBe('VALIDATION_ERROR')
    const wrong = await call('/api/auth/change-password', 'POST', {
      currentPassword: 'wrong-password',
      newPassword: 'new-correct-horse-battery',
    })
    expect(wrong.statusCode).toBe(401)
    const changed = await call('/api/auth/change-password', 'POST', {
      currentPassword: 'correct-horse-battery',
      newPassword: 'new-correct-horse-battery',
    })
    expect(changed.statusCode).toBe(200)
    expect((await call('/api/websites')).statusCode).toBe(401)
    const oldLogin = await call(
      '/api/auth/login',
      'POST',
      { password: 'correct-horse-battery' },
      false,
    )
    expect(oldLogin.statusCode).toBe(401)
    const newLogin = await call(
      '/api/auth/login',
      'POST',
      { password: 'new-correct-horse-battery' },
      false,
    )
    expect(newLogin.statusCode).toBe(200)
    cookie = newLogin.headers['set-cookie']!.toString().split(';')[0]!
    csrf = newLogin.json().csrfToken
    expect((await call('/api/websites')).statusCode).toBe(200)
  })

  test('reset generates a new password and invalidates all existing sessions', async () => {
    const generated = await resetAdminPassword(db)
    expect(generated.length).toBeGreaterThanOrEqual(32)
    expect((await call('/api/websites')).statusCode).toBe(401)
    expect(
      (await call('/api/auth/login', 'POST', { password: 'new-correct-horse-battery' }, false))
        .statusCode,
    ).toBe(401)
    expect((await call('/api/auth/login', 'POST', { password: generated }, false)).statusCode).toBe(
      200,
    )
  })
})

test('encoded administrator hash loads without dollar-sign interpolation', async () => {
  const hash = await Bun.password.hash('example-long-password', { algorithm: 'argon2id' })
  const loaded = readConfig({
    SURREAL_URL: 'ws://localhost:8000',
    SURREAL_USER: 'root',
    SURREAL_PASS: 'test-password',
    SURREAL_NAMESPACE: 'sitehub',
    SURREAL_DATABASE: 'sitehub',
    SESSION_SECRET: 'test-secret-with-at-least-thirty-two-characters',
    ADMIN_PASSWORD_HASH_BASE64: Buffer.from(hash).toString('base64'),
    APP_ORIGIN: origin,
  } as typeof Bun.env)
  expect(loaded.adminPasswordHash).toBe(hash)
})
